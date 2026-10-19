import { describe, expect, it, vi } from "vitest";
import {
  eventsFixture,
  iterationsFixture,
  lineupsFixture,
  matchesFixture,
  playersFixture,
  squadsFixture,
} from "./fixtures.js";
import {
  eventsUrl,
  fetchIterations,
  fetchLineups,
  fetchMatches,
  fetchMatchEvents,
  fetchPlayers,
  fetchSquads,
  IMPECT_BUNDESLIGA_2023_24,
  IMPECT_OPEN_DATA_BASE_URL,
  iterationsUrl,
  lineupsUrl,
  loadMatchEvents,
  matchesUrl,
  playersUrl,
  squadsUrl,
} from "./load.js";

/** Records the URL it was called with, so assertions can check it. */
function mockFetch(body: unknown, status = 200) {
  const calls: string[] = [];
  const fetchImpl = vi.fn((input: URL | RequestInfo) => {
    calls.push(String(input));
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  }) as unknown as typeof globalThis.fetch;
  return { fetchImpl, calls };
}

describe("URLs", () => {
  it("follow the repository's layout", () => {
    const base = IMPECT_OPEN_DATA_BASE_URL;
    expect(iterationsUrl()).toBe(`${base}/iterations.json`);
    expect(matchesUrl(743)).toBe(`${base}/matches/matches_743.json`);
    expect(squadsUrl(743)).toBe(`${base}/squads/squads_743.json`);
    expect(playersUrl(743)).toBe(`${base}/players/players_743.json`);
    expect(eventsUrl(122838)).toBe(`${base}/events/events_122838.json`);
    expect(lineupsUrl(122838)).toBe(`${base}/lineups/lineups_122838.json`);
  });

  it("take a baseUrl override, trailing slash or not", () => {
    expect(eventsUrl(1, { baseUrl: "http://localhost/data/" })).toBe(
      "http://localhost/data/events/events_1.json",
    );
  });

  it("name the open data's one iteration", () => {
    expect(IMPECT_BUNDESLIGA_2023_24).toBe(743);
  });
});

describe("fetchers", () => {
  it("fetch and parse each file from its open-data URL", async () => {
    const cases = [
      [() => fetchIterations, iterationsFixture(), iterationsUrl()],
      [() => fetchMatches.bind(null, 743), matchesFixture(), matchesUrl(743)],
      [() => fetchSquads.bind(null, 743), squadsFixture(), squadsUrl(743)],
      [() => fetchPlayers.bind(null, 743), playersFixture(), playersUrl(743)],
      [() => fetchMatchEvents.bind(null, 1), eventsFixture(), eventsUrl(1)],
      [() => fetchLineups.bind(null, 1), lineupsFixture(), lineupsUrl(1)],
    ] as const;
    for (const [get, body, url] of cases) {
      const { fetchImpl, calls } = mockFetch(body);
      const fetcher = get() as (options: { fetch: typeof globalThis.fetch }) => Promise<unknown>;
      expect(await fetcher({ fetch: fetchImpl })).toBeTruthy();
      expect(calls).toEqual([url]);
    }
  });

  it("lift coordinates on the way in", async () => {
    const { fetchImpl } = mockFetch(eventsFixture());
    const events = await loadMatchEvents("http://localhost/e.json", { fetch: fetchImpl });
    expect(events[4]).toMatchObject({ x: -40, y: -1 });
  });

  it("report a missing file as an HTTP error", async () => {
    const { fetchImpl } = mockFetch({ message: "Not Found" }, 404);
    await expect(fetchMatchEvents(999, { fetch: fetchImpl })).rejects.toMatchObject({
      kind: "http",
      status: 404,
    });
  });
});
