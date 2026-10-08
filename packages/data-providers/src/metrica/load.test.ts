import { describe, expect, it, vi } from "vitest";
import { DataProviderError } from "../errors.js";
import { awayTrackingFixture, eventsFixture, homeTrackingFixture } from "./fixtures.js";
import {
  eventsUrl,
  fetchEvents,
  fetchTracking,
  fetchTrackingWindow,
  loadTrackingWindow,
  METRICA_SAMPLE_DATA_BASE_URL,
  streamTracking,
  streamTrackingFrom,
  trackingUrls,
} from "./load.js";

const URLS = trackingUrls(1);
const FILES: Record<string, string> = {
  [URLS.home]: homeTrackingFixture(),
  [URLS.away]: awayTrackingFixture(),
  [eventsUrl(1)]: eventsFixture(),
};

/**
 * A static host over the fixtures. With `ranges`, it honours `Range` the way
 * raw.githubusercontent.com does: a 206 with `Content-Range`, for both
 * `bytes=a-b` and the suffix form `bytes=-n`.
 */
function host({ ranges = true } = {}) {
  const calls: { url: string; range: string | null }[] = [];
  const fetchImpl = vi.fn((input: URL | RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const range = new Headers(init?.headers).get("Range");
    calls.push({ url, range });
    const file = FILES[url];
    if (file === undefined) return Promise.resolve(new Response("Not Found", { status: 404 }));
    if (!ranges || range === null) return Promise.resolve(new Response(file, { status: 200 }));

    const bytes = new TextEncoder().encode(file);
    const suffix = /^bytes=-(\d+)$/.exec(range);
    const span = /^bytes=(\d+)-(\d+)$/.exec(range);
    const start = suffix ? Math.max(0, bytes.length - Number(suffix[1])) : Number(span?.[1]);
    const end = suffix ? bytes.length - 1 : Math.min(bytes.length - 1, Number(span?.[2]));
    return Promise.resolve(
      new Response(bytes.slice(start, end + 1), {
        status: 206,
        headers: { "Content-Range": `bytes ${start}-${end}/${bytes.length}` },
      }),
    );
  }) as unknown as typeof globalThis.fetch;
  return { fetchImpl, calls };
}

/** A body that hands out one line per pull and never closes on its own. */
function endlessBody(text: string, onCancel: () => void): ReadableStream<Uint8Array> {
  const lines = text.split("\n");
  let next = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(new TextEncoder().encode(`${lines[next++ % lines.length] ?? ""}\n`));
    },
    cancel: onCancel,
  });
}

describe("URLs", () => {
  it("follow the repository's layout", () => {
    expect(eventsUrl(2)).toBe(
      `${METRICA_SAMPLE_DATA_BASE_URL}/Sample_Game_2/Sample_Game_2_RawEventsData.csv`,
    );
    expect(trackingUrls(2).away).toBe(
      `${METRICA_SAMPLE_DATA_BASE_URL}/Sample_Game_2/Sample_Game_2_RawTrackingData_Away_Team.csv`,
    );
  });

  it("take a baseUrl override, trailing slash or not", () => {
    expect(trackingUrls(1, { baseUrl: "http://localhost/data/" }).home).toBe(
      "http://localhost/data/Sample_Game_1/Sample_Game_1_RawTrackingData_Home_Team.csv",
    );
  });
});

describe("fetchEvents", () => {
  it("fetches and parses a game's events", async () => {
    const { fetchImpl } = host();
    expect(await fetchEvents(1, { fetch: fetchImpl })).toHaveLength(56);
  });

  it("reports a missing file as an HTTP error", async () => {
    const { fetchImpl } = host();
    await expect(fetchEvents(3, { fetch: fetchImpl })).rejects.toMatchObject({
      kind: "http",
      status: 404,
    });
  });
});

describe("fetchTracking", () => {
  it("reads both files whole and merges them", async () => {
    const { fetchImpl, calls } = host();
    const frames = await fetchTracking(1, { fetch: fetchImpl });
    expect(frames).toHaveLength(151);
    expect(calls.map((call) => call.url).sort()).toEqual([URLS.away, URLS.home].sort());
  });
});

describe("streamTracking", () => {
  it("yields every merged frame in order", async () => {
    const { fetchImpl } = host();
    const frames = [];
    for await (const frame of streamTracking(1, { fetch: fetchImpl })) frames.push(frame);
    expect(frames).toHaveLength(151);
    expect(frames[0]?.players).toHaveLength(22);
    expect(frames.map((frame) => frame.Frame)).toEqual(
      Array.from({ length: 151 }, (_, i) => 2250 + i),
    );
  });

  it("reassembles rows split across chunk boundaries", async () => {
    const chunked = (text: string) =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder();
          for (let i = 0; i < text.length; i += 777) {
            controller.enqueue(encoder.encode(text.slice(i, i + 777)));
          }
          controller.close();
        },
      });
    const fetchImpl = vi.fn((input: URL | RequestInfo) =>
      Promise.resolve(new Response(chunked(FILES[String(input)] ?? ""), { status: 200 })),
    ) as unknown as typeof globalThis.fetch;

    const frames = [];
    for await (const frame of streamTrackingFrom(URLS, { fetch: fetchImpl })) frames.push(frame);
    expect(frames).toHaveLength(151);
  });

  it("cancels both downloads when the caller breaks out", async () => {
    const cancelled = { home: false, away: false };
    const fetchImpl = vi.fn((input: URL | RequestInfo) => {
      const side = String(input) === URLS.home ? "home" : "away";
      const body = endlessBody(FILES[String(input)] ?? "", () => {
        cancelled[side] = true;
      });
      return Promise.resolve(new Response(body, { status: 200 }));
    }) as unknown as typeof globalThis.fetch;

    const frames = [];
    for await (const frame of streamTracking(1, { fetch: fetchImpl })) {
      frames.push(frame);
      if (frames.length === 10) break;
    }
    expect(frames).toHaveLength(10);
    expect(cancelled).toEqual({ home: true, away: true });
  });

  it("falls back to a whole read when the response has no streaming body", async () => {
    const fetchImpl = vi.fn((input: URL | RequestInfo) => {
      const response = new Response(FILES[String(input)] ?? "", { status: 200 });
      Object.defineProperty(response, "body", { value: null });
      return Promise.resolve(response);
    }) as unknown as typeof globalThis.fetch;

    const frames = [];
    for await (const frame of streamTracking(1, { fetch: fetchImpl })) frames.push(frame);
    expect(frames).toHaveLength(151);
  });

  it("fails when one file ends before the other", async () => {
    const short = homeTrackingFixture().split("\n").slice(0, 10).join("\n");
    const fetchImpl = vi.fn((input: URL | RequestInfo) =>
      Promise.resolve(
        new Response(String(input) === URLS.home ? short : FILES[String(input)], { status: 200 }),
      ),
    ) as unknown as typeof globalThis.fetch;

    const read = async () => {
      for await (const frame of streamTracking(1, { fetch: fetchImpl })) void frame;
    };
    await expect(read()).rejects.toThrow(/ended before the other/);
  });

  it("fails when a file ends inside its header", async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(",,,Home\n", { status: 200 })),
    ) as unknown as typeof globalThis.fetch;
    const read = async () => {
      for await (const frame of streamTracking(1, { fetch: fetchImpl })) void frame;
    };
    await expect(read()).rejects.toThrow(/ended inside its header/);
  });
});

describe("fetchTrackingWindow", () => {
  it("returns exactly the frames asked for, merged", async () => {
    const { fetchImpl } = host();
    const frames = await fetchTrackingWindow(1, {
      fromFrame: 2289,
      toFrame: 2309,
      fetch: fetchImpl,
    });
    expect(frames.map((frame) => frame.Frame)).toEqual(
      Array.from({ length: 21 }, (_, i) => 2289 + i),
    );
    expect(frames[0]?.players).toHaveLength(22);
  });

  it("reads only byte ranges, never a whole file", async () => {
    const { fetchImpl, calls } = host();
    await fetchTrackingWindow(1, { fromFrame: 2300, toFrame: 2310, fetch: fetchImpl });
    expect(calls.every((call) => call.range !== null)).toBe(true);
  });

  it("corrects an estimate that misses, with small reads", async () => {
    // This fixture's frames start at 2250, not 1, so the uniform estimate
    // is far off. With a little padding the first read misses, and the next
    // one is moved by what it measured.
    const { fetchImpl, calls } = host();
    const tuning = { padBytes: 512, maxAttempts: 6 };
    for (const [fromFrame, toFrame] of [
      [2250, 2255],
      [2330, 2340],
      [2395, 2400],
    ] as const) {
      const frames = await loadTrackingWindow(
        URLS,
        { fromFrame, toFrame, fetch: fetchImpl },
        tuning,
      );
      expect(frames.map((frame) => frame.Frame)).toEqual(
        Array.from({ length: toFrame - fromFrame + 1 }, (_, i) => fromFrame + i),
      );
    }
    // More than the two probes and one read per file: the correction ran.
    expect(calls.length).toBeGreaterThan(3 * 2 * 3);
  });

  it("returns fewer frames, never wrong ones, when out of attempts", async () => {
    const { fetchImpl } = host();
    const frames = await loadTrackingWindow(
      URLS,
      { fromFrame: 2330, toFrame: 2340, fetch: fetchImpl },
      { padBytes: 16, maxAttempts: 1 },
    );
    for (const frame of frames) {
      expect(frame.Frame).toBeGreaterThanOrEqual(2330);
      expect(frame.Frame).toBeLessThanOrEqual(2340);
    }
  });

  it("returns nothing for a window after the last frame", async () => {
    const { fetchImpl } = host();
    expect(
      await fetchTrackingWindow(1, { fromFrame: 9000, toFrame: 9010, fetch: fetchImpl }),
    ).toEqual([]);
  });

  it("still works when the host ignores Range and returns the whole file", async () => {
    const { fetchImpl } = host({ ranges: false });
    const frames = await fetchTrackingWindow(1, {
      fromFrame: 2300,
      toFrame: 2304,
      fetch: fetchImpl,
    });
    expect(frames.map((frame) => frame.Frame)).toEqual([2300, 2301, 2302, 2303, 2304]);
  });

  it("rejects a window that isn't whole frames in order", async () => {
    await expect(fetchTrackingWindow(1, { fromFrame: 10, toFrame: 5 })).rejects.toThrow(
      DataProviderError,
    );
    await expect(fetchTrackingWindow(1, { fromFrame: 1.5, toFrame: 5 })).rejects.toThrow(
      /whole frame numbers/,
    );
  });
});
