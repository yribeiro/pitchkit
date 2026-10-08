import { describe, expect, it, vi } from "vitest";
import { DataProviderError } from "../errors.js";
import {
  awayKickOffFixture,
  awayTrackingFixture,
  eventsFixture,
  homeKickOffFixture,
  homeTrackingFixture,
} from "./fixtures.js";
import {
  eventsUrl,
  fetchEvents,
  fetchTracking,
  fetchTrackingWindow,
  loadTrackingWindow,
  METRICA_SAMPLE_DATA_BASE_URL,
  readTrackingWindow,
  streamTracking,
  streamTrackingFrom,
  trackingUrls,
} from "./load.js";

const URLS = trackingUrls(1);

/**
 * Real rows, joined: the kick-off (frames 1-3) and then frames 2250-2400 of
 * the same file. The jump makes the head's bytes-per-frame useless for
 * finding frame 2300, which is what the correction has to cope with.
 */
function withKickOff(kickOff: string, sample: string): string {
  return `${kickOff.trimEnd()}\n${sample.split("\n").slice(3).join("\n")}`;
}
const GAPPED = trackingUrls(1, { baseUrl: "http://localhost/gapped" });

const FILES: Record<string, string> = {
  [URLS.home]: homeTrackingFixture(),
  [URLS.away]: awayTrackingFixture(),
  [GAPPED.home]: withKickOff(homeKickOffFixture(), homeTrackingFixture()),
  [GAPPED.away]: withKickOff(awayKickOffFixture(), awayTrackingFixture()),
  [eventsUrl(1)]: eventsFixture(),
};

/**
 * A static host over the fixtures, as a browser sees raw.githubusercontent.com.
 * With `ranges`, `bytes=a-b` gets a 206, and a start past the end a 416. No
 * `Content-Range` is sent, because script can't read it cross-origin, and a
 * suffix range fails the way its CORS preflight does there.
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

    const span = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!span) return Promise.reject(new TypeError("Failed to fetch"));
    const bytes = new TextEncoder().encode(file);
    const start = Number(span[1]);
    if (start >= bytes.length) return Promise.resolve(new Response("", { status: 416 }));
    const end = Math.min(bytes.length - 1, Number(span[2]));
    return Promise.resolve(new Response(bytes.slice(start, end + 1), { status: 206 }));
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

/** Small enough that the fixture needs more than its head read. */
const SMALL = { headBytes: 2048, padBytes: 512, maxAttempts: 6 };

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

  it("asks only for simple byte ranges, which browsers send without a preflight", async () => {
    const { fetchImpl, calls } = host();
    await readTrackingWindow(URLS, { fromFrame: 2300, toFrame: 2310, fetch: fetchImpl }, SMALL);
    expect(calls.length).toBeGreaterThan(2);
    expect(calls.every((call) => /^bytes=\d+-\d+$/.test(call.range ?? ""))).toBe(true);
  });

  it("corrects an estimate that misses, with small reads", async () => {
    // The head holds frames 1-3, so it puts frame 2300 a few hundred KB into
    // a 35 KB file. The read past the end draws a 416, and the reads after
    // it home in on what they measured.
    const { fetchImpl, calls } = host();
    for (const [fromFrame, toFrame] of [
      [2250, 2255],
      [2330, 2340],
      [2395, 2400],
    ] as const) {
      const frames = await readTrackingWindow(
        GAPPED,
        { fromFrame, toFrame, fetch: fetchImpl },
        { headBytes: 1024, padBytes: 512, maxAttempts: 16 },
      );
      expect(frames.map((frame) => frame.Frame)).toEqual(
        Array.from({ length: toFrame - fromFrame + 1 }, (_, i) => fromFrame + i),
      );
    }
    // More than the head and one read per file: the correction ran.
    expect(calls.length).toBeGreaterThan(3 * 2 * 2);
  });

  it("returns fewer frames, never wrong ones, when out of attempts", async () => {
    const { fetchImpl } = host();
    const frames = await readTrackingWindow(
      URLS,
      { fromFrame: 2330, toFrame: 2340, fetch: fetchImpl },
      { headBytes: 2048, padBytes: 16, maxAttempts: 1 },
    );
    for (const frame of frames) {
      expect(frame.Frame).toBeGreaterThanOrEqual(2330);
      expect(frame.Frame).toBeLessThanOrEqual(2340);
    }
  });

  it("loadTrackingWindow takes any pair of URLs", async () => {
    const { fetchImpl } = host();
    const frames = await loadTrackingWindow(URLS, {
      fromFrame: 2289,
      toFrame: 2290,
      fetch: fetchImpl,
    });
    expect(frames.map((frame) => frame.Frame)).toEqual([2289, 2290]);
  });

  it("returns nothing for a window after the last frame", async () => {
    const { fetchImpl } = host();
    expect(
      await fetchTrackingWindow(1, { fromFrame: 9000, toFrame: 9010, fetch: fetchImpl }),
    ).toEqual([]);
    // Past the end of the file: the estimate draws a 416, and the next read
    // backs off rather than giving up.
    expect(
      await readTrackingWindow(URLS, { fromFrame: 9000, toFrame: 9010, fetch: fetchImpl }, SMALL),
    ).toEqual([]);
  });

  it("reaches the last frame of the file", async () => {
    const { fetchImpl } = host();
    const frames = await readTrackingWindow(
      URLS,
      { fromFrame: 2398, toFrame: 2405, fetch: fetchImpl },
      SMALL,
    );
    expect(frames.map((frame) => frame.Frame)).toEqual([2398, 2399, 2400]);
  });

  it("returns nothing if the head itself is past the end", async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response("", { status: 416 })),
    ) as unknown as typeof globalThis.fetch;
    expect(await fetchTrackingWindow(1, { fromFrame: 1, toFrame: 2, fetch: fetchImpl })).toEqual(
      [],
    );
  });

  it("passes other HTTP errors through", async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response("", { status: 500 })),
    ) as unknown as typeof globalThis.fetch;
    await expect(
      fetchTrackingWindow(1, { fromFrame: 1, toFrame: 2, fetch: fetchImpl }),
    ).rejects.toMatchObject({ kind: "http", status: 500 });
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
