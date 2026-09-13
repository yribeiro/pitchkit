import { describe, expect, it, vi } from "vitest";
import { DataProviderError } from "../errors.js";
import {
  dynamicEventsFixture,
  matchFixture,
  matchesFixture,
  phasesFixture,
  trackingFixture,
} from "./fixtures.js";
import {
  SKILLCORNER_LFS_BASE_URL,
  SKILLCORNER_OPEN_DATA_BASE_URL,
  fetchDynamicEvents,
  fetchMatch,
  fetchMatches,
  fetchPhasesOfPlay,
  fetchTracking,
  fetchTrackingWindow,
  loadDynamicEvents,
  loadMatch,
  loadMatches,
  loadPhasesOfPlay,
  loadTracking,
  matchUrl,
  streamTracking,
  streamTrackingFrom,
  trackingUrl,
} from "./load.js";
import { parseMatch } from "./parse.js";

const match = parseMatch(matchFixture());

/** Records the URL and init it was called with, so assertions can check both. */
function mockFetch(handler: (url: string, init?: RequestInit) => Response) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = vi.fn((input: URL | RequestInfo, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    return Promise.resolve(handler(url, init));
  }) as unknown as typeof globalThis.fetch;
  return { fetchImpl, calls };
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}

describe("URLs", () => {
  it("serves tracking from the LFS host, not the raw one", () => {
    // raw.githubusercontent serves a ~130-byte LFS pointer for these files,
    // which parses as "not JSON" — a genuinely confusing failure, so the
    // hosts are asserted apart rather than left to a comment.
    expect(trackingUrl(1874553)).toContain(SKILLCORNER_LFS_BASE_URL);
    expect(trackingUrl(1874553)).not.toContain(SKILLCORNER_OPEN_DATA_BASE_URL);
    expect(trackingUrl(1874553)).toMatch(/1874553_tracking_extrapolated\.jsonl$/);
  });

  it("lets a single baseUrl override stand in for both hosts", () => {
    expect(trackingUrl(1, { baseUrl: "http://localhost/data" })).toBe(
      "http://localhost/data/matches/1/1_tracking_extrapolated.jsonl",
    );
  });
});

describe("the small files", () => {
  it("loads the match index", async () => {
    const { fetchImpl, calls } = mockFetch(() => textResponse(JSON.stringify(matchesFixture())));
    const matches = await fetchMatches({ fetch: fetchImpl });
    expect(matches).toHaveLength(20);
    expect(calls[0]?.url).toBe(`${SKILLCORNER_OPEN_DATA_BASE_URL}/matches.json`);
  });

  it("loads a match", async () => {
    const { fetchImpl } = mockFetch(() => textResponse(JSON.stringify(matchFixture())));
    expect((await fetchMatch(1874553, { fetch: fetchImpl })).id).toBe(1874553);
  });

  it("loads dynamic events as CSV and projects with the match's pitch", async () => {
    const { fetchImpl, calls } = mockFetch(() => textResponse(dynamicEventsFixture()));
    const events = await fetchDynamicEvents(match, { fetch: fetchImpl });
    expect(events).toHaveLength(70);
    expect(calls[0]?.url).toMatch(/1874553_dynamic_events\.csv$/);
  });

  it("loads phases of play", async () => {
    const { fetchImpl } = mockFetch(() => textResponse(phasesFixture()));
    expect(await fetchPhasesOfPlay(match, { fetch: fetchImpl })).toHaveLength(40);
  });

  it("reports a 404 as an http error carrying the status", async () => {
    const { fetchImpl } = mockFetch(() => textResponse("Not Found", 404));
    const error = await fetchMatches({ fetch: fetchImpl }).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(DataProviderError);
    expect((error as DataProviderError).kind).toBe("http");
    expect((error as DataProviderError).status).toBe(404);
  });

  it("reports an unreachable host as a network error", async () => {
    const fetchImpl = vi.fn(() =>
      Promise.reject(new TypeError("Failed to fetch")),
    ) as unknown as typeof globalThis.fetch;
    const error = await fetchMatches({ fetch: fetchImpl }).catch((cause: unknown) => cause);
    expect((error as DataProviderError).kind).toBe("network");
  });
});

describe("load* — the any-URL primitives", () => {
  const MIRROR = "https://files.example.test/skillcorner";

  it("take a URL the open-data layout doesn't cover", async () => {
    const { fetchImpl, calls } = mockFetch((url) =>
      url.endsWith(".json")
        ? textResponse(JSON.stringify(matchFixture()))
        : textResponse(dynamicEventsFixture()),
    );

    const loaded = await loadMatch(`${MIRROR}/my-match.json`, { fetch: fetchImpl });
    const events = await loadDynamicEvents(`${MIRROR}/whatever.csv`, loaded, { fetch: fetchImpl });

    expect(loaded.id).toBe(1874553);
    expect(events).toHaveLength(70);
    expect(calls.map((call) => call.url)).toEqual([
      `${MIRROR}/my-match.json`,
      `${MIRROR}/whatever.csv`,
    ]);
  });

  it("cover the index, phases and whole-file tracking too", async () => {
    const matches = await loadMatches(`${MIRROR}/index.json`, {
      fetch: mockFetch(() => textResponse(JSON.stringify(matchesFixture()))).fetchImpl,
    });
    expect(matches).toHaveLength(20);

    const phases = await loadPhasesOfPlay(`${MIRROR}/p.csv`, match, {
      fetch: mockFetch(() => textResponse(phasesFixture())).fetchImpl,
    });
    expect(phases).toHaveLength(40);

    const frames = await loadTracking(`${MIRROR}/t.jsonl`, match, {
      fetch: mockFetch(() => textResponse(trackingFixture())).fetchImpl,
    });
    expect(frames).toHaveLength(123);
  });

  it("stream from an arbitrary URL, still aborting on break", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      // Chunked and left open: a single enqueue-then-close stream is already
      // finished by the time the consumer breaks, and cancelling a closed
      // stream never reaches the source — so a one-chunk body would assert
      // nothing about aborting.
      pull(controller) {
        controller.enqueue(new TextEncoder().encode(`${trackingFixture().split("\n")[0] ?? ""}\n`));
      },
      cancel() {
        cancelled = true;
      },
    });
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(body, { status: 200 })),
    ) as unknown as typeof globalThis.fetch;

    const frames = [];
    for await (const frame of streamTrackingFrom(`${MIRROR}/t.jsonl`, match, {
      fetch: fetchImpl,
    })) {
      frames.push(frame);
      if (frames.length === 3) break;
    }
    expect(frames).toHaveLength(3);
    expect(cancelled).toBe(true);
  });

  it("are what the fetch* sugar delegates to, so both hit the same URL", async () => {
    const { fetchImpl, calls } = mockFetch(() => textResponse(JSON.stringify(matchFixture())));
    await fetchMatch(1874553, { fetch: fetchImpl });
    expect(calls[0]?.url).toBe(matchUrl(1874553));
  });
});

describe("streamTracking", () => {
  it("yields every frame in file order", async () => {
    const { fetchImpl } = mockFetch(() => textResponse(trackingFixture()));
    const frames = [];
    for await (const frame of streamTracking(match, { fetch: fetchImpl })) frames.push(frame);
    expect(frames).toHaveLength(123);
    expect(frames[0]?.frame ?? 0).toBeLessThan(frames.at(-1)?.frame ?? 0);
  });

  it("stops reading when the caller breaks out", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        // Deliberately split mid-line, so the buffering across chunk
        // boundaries is exercised rather than assumed.
        const text = trackingFixture();
        const half = Math.floor(text.length / 2);
        controller.enqueue(encoder.encode(text.slice(0, half)));
        controller.enqueue(encoder.encode(text.slice(half)));
        controller.close();
      },
      cancel() {
        cancelled = true;
      },
    });

    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(body, { status: 200 })),
    ) as unknown as typeof globalThis.fetch;

    const frames = [];
    for await (const frame of streamTracking(match, { fetch: fetchImpl })) {
      frames.push(frame);
      if (frames.length === 5) break;
    }

    expect(frames).toHaveLength(5);
    expect(cancelled).toBe(true);
  });

  it("falls back to a whole read when the response has no streaming body", async () => {
    // Some fetch implementations (and mocks) return a body-less Response.
    // Failing there would be gratuitous, so the generator reads it whole.
    const response = new Response(trackingFixture(), { status: 200 });
    Object.defineProperty(response, "body", { value: null });
    const fetchImpl = vi.fn(() => Promise.resolve(response)) as unknown as typeof globalThis.fetch;

    const frames = [];
    for await (const frame of streamTracking(match, { fetch: fetchImpl })) frames.push(frame);
    expect(frames).toHaveLength(123);
  });

  it("reassembles frames split across chunk boundaries", async () => {
    const text = trackingFixture();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (let i = 0; i < text.length; i += 777) {
          controller.enqueue(encoder.encode(text.slice(i, i + 777)));
        }
        controller.close();
      },
    });
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(body, { status: 200 })),
    ) as unknown as typeof globalThis.fetch;

    const frames = [];
    for await (const frame of streamTracking(match, { fetch: fetchImpl })) frames.push(frame);
    expect(frames).toHaveLength(123);
  });
});

describe("fetchTrackingWindow", () => {
  const lines = trackingFixture().split("\n").filter(Boolean);

  it("asks for a byte range and keeps only the frames requested", async () => {
    const { fetchImpl, calls } = mockFetch(() => {
      // Mimic a ranged read: a severed first line, then whole ones.
      const body = `{"frame":0,"broken`.concat("\n", lines.slice(0, 60).join("\n"));
      return textResponse(body, 206);
    });

    const first = JSON.parse(lines[0] ?? "{}") as { frame: number };
    const frames = await fetchTrackingWindow(match, {
      fetch: fetchImpl,
      fromFrame: first.frame,
      toFrame: first.frame + 10,
    });

    expect(calls[0]?.init?.headers).toMatchObject({
      Range: expect.stringMatching(/^bytes=\d+-\d+$/),
    });
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      expect(frame.frame).toBeGreaterThanOrEqual(first.frame);
      expect(frame.frame).toBeLessThanOrEqual(first.frame + 10);
    }
  });

  it("still works when the host ignores Range and returns the whole file", async () => {
    const { fetchImpl } = mockFetch(() => textResponse(trackingFixture(), 200));
    const target = (JSON.parse(lines.at(-1) ?? "{}") as { frame: number }).frame;
    const frames = await fetchTrackingWindow(match, {
      fetch: fetchImpl,
      fromFrame: target,
      toFrame: target,
    });
    expect(frames).toHaveLength(1);
    expect(frames[0]?.frame).toBe(target);
  });

  it("rejects a backwards window instead of returning nothing", async () => {
    const { fetchImpl } = mockFetch(() => textResponse(""));
    await expect(
      fetchTrackingWindow(match, { fetch: fetchImpl, fromFrame: 90, toFrame: 10 }),
    ).rejects.toThrow(/toFrame >= fromFrame/);
  });

  it("rejects fractional frame numbers", async () => {
    const { fetchImpl } = mockFetch(() => textResponse(""));
    await expect(
      fetchTrackingWindow(match, { fetch: fetchImpl, fromFrame: 1.5, toFrame: 9 }),
    ).rejects.toThrow(/whole frame numbers/);
  });
});

describe("fetchTracking", () => {
  it("reads the whole file from the LFS host", async () => {
    const { fetchImpl, calls } = mockFetch(() => textResponse(trackingFixture()));
    const frames = await fetchTracking(match, { fetch: fetchImpl });
    expect(frames).toHaveLength(123);
    expect(calls[0]?.url).toContain(SKILLCORNER_LFS_BASE_URL);
  });

  it("surfaces an LFS pointer stub as a parse error naming the cause", async () => {
    // What raw.githubusercontent returns for these paths. Worth its own test:
    // it is the single most likely way to misuse this loader.
    const pointer = [
      "version https://git-lfs.github.com/spec/v1",
      "oid sha256:ea97f58f8eaad925feaeacc6395ec24860dd80027af8a89450276adebd29d265",
      "size 90729279",
    ].join("\n");
    const { fetchImpl } = mockFetch(() => textResponse(pointer));
    const error = await fetchTracking(match, { fetch: fetchImpl }).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(DataProviderError);
    expect((error as DataProviderError).kind).toBe("parse");
  });
});
