import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { DataProviderError } from "../errors.js";
import {
  STATSBOMB_OPEN_DATA_BASE_URL,
  fetchCompetitions,
  fetchLineups,
  fetchMatchEvents,
  fetchMatchThreeSixty,
  fetchMatches,
  loadEvents,
  loadThreeSixty,
  matchEventsUrl,
  matchThreeSixtyUrl,
} from "./load.js";
import { shots } from "./select.js";

/** Serves a fixture file to any URL, and records what was requested. */
function stubFetch(fixtureName: string) {
  const body = readFileSync(new URL(`./__fixtures__/${fixtureName}.json`, import.meta.url), "utf8");
  // Declares fetch's own parameter type (rather than `async () => ...`) so
  // `mock.calls` carries the requested URL — asserting on that is half of
  // what these tests check.
  return vi.fn(async (_url: URL | RequestInfo) => new Response(body));
}

function requestedUrl(stub: ReturnType<typeof stubFetch>): string | undefined {
  const first = stub.mock.calls[0]?.[0];
  return first === undefined ? undefined : String(first);
}

describe("loadEvents", () => {
  it("fetches and parses in one call", async () => {
    const fetchStub = stubFetch("events-15946-sample");
    const events = await loadEvents("https://example.test/events.json", { fetch: fetchStub });

    expect(events).toHaveLength(29);
    expect(shots(events)).toHaveLength(5);
    expect(requestedUrl(fetchStub)).toBe("https://example.test/events.json");
  });

  it("surfaces a schema failure when the URL points at the wrong file", async () => {
    const fetchStub = stubFetch("matches-43-106-sample");
    const error = await loadEvents("https://example.test/oops.json", { fetch: fetchStub }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(DataProviderError);
    expect((error as DataProviderError).kind).toBe("schema");
  });

  it("surfaces an HTTP failure unchanged", async () => {
    const fetchStub = async () => new Response("", { status: 404 });
    const error = await loadEvents("https://example.test/nope.json", { fetch: fetchStub }).catch(
      (e: unknown) => e,
    );

    expect((error as DataProviderError).kind).toBe("http");
    expect((error as DataProviderError).status).toBe(404);
  });
});

describe("loadThreeSixty", () => {
  it("fetches and parses in one call", async () => {
    const fetchStub = stubFetch("three-sixty-3857276-sample");
    const frames = await loadThreeSixty("https://example.test/three-sixty.json", {
      fetch: fetchStub,
    });

    expect(frames).toHaveLength(12);
    expect(requestedUrl(fetchStub)).toBe("https://example.test/three-sixty.json");
  });

  it("surfaces a schema failure when the URL points at the wrong file", async () => {
    const fetchStub = stubFetch("events-15946-sample");
    const error = await loadThreeSixty("https://example.test/oops.json", {
      fetch: fetchStub,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DataProviderError);
    expect((error as DataProviderError).kind).toBe("schema");
  });
});

describe("open-data URL building", () => {
  it("points at the public repo by default", () => {
    expect(matchEventsUrl(15946)).toBe(`${STATSBOMB_OPEN_DATA_BASE_URL}/events/15946.json`);
    expect(matchThreeSixtyUrl(15946)).toBe(
      `${STATSBOMB_OPEN_DATA_BASE_URL}/three-sixty/15946.json`,
    );
    expect(STATSBOMB_OPEN_DATA_BASE_URL).toMatch(/^https:\/\//);
  });

  it("honours a baseUrl override, so a mirror or pinned commit works", () => {
    expect(matchEventsUrl(15946, { baseUrl: "https://mirror.test/data" })).toBe(
      "https://mirror.test/data/events/15946.json",
    );
  });

  it("tolerates a trailing slash on baseUrl", () => {
    expect(matchEventsUrl(15946, { baseUrl: "https://mirror.test/data/" })).toBe(
      "https://mirror.test/data/events/15946.json",
    );
  });
});

describe("fetch helpers", () => {
  it("fetchMatchEvents builds the events URL", async () => {
    const fetchStub = stubFetch("events-15946-sample");
    await fetchMatchEvents(15946, { fetch: fetchStub });
    expect(requestedUrl(fetchStub)).toBe(`${STATSBOMB_OPEN_DATA_BASE_URL}/events/15946.json`);
  });

  it("fetchCompetitions builds the competitions URL", async () => {
    const fetchStub = stubFetch("competitions-sample");
    const competitions = await fetchCompetitions({ fetch: fetchStub });

    expect(competitions).toHaveLength(3);
    expect(requestedUrl(fetchStub)).toBe(`${STATSBOMB_OPEN_DATA_BASE_URL}/competitions.json`);
  });

  it("fetchMatches needs both a competition and a season id", async () => {
    const fetchStub = stubFetch("matches-43-106-sample");
    const matches = await fetchMatches(43, 106, { fetch: fetchStub });

    expect(matches).toHaveLength(3);
    expect(requestedUrl(fetchStub)).toBe(`${STATSBOMB_OPEN_DATA_BASE_URL}/matches/43/106.json`);
  });

  it("fetchLineups builds the lineups URL", async () => {
    const fetchStub = stubFetch("lineups-15946-sample");
    const lineups = await fetchLineups(15946, { fetch: fetchStub });

    expect(lineups).toHaveLength(2);
    expect(requestedUrl(fetchStub)).toBe(`${STATSBOMB_OPEN_DATA_BASE_URL}/lineups/15946.json`);
  });

  it("fetchMatchThreeSixty builds the three-sixty URL", async () => {
    const fetchStub = stubFetch("three-sixty-3857276-sample");
    const frames = await fetchMatchThreeSixty(3857276, { fetch: fetchStub });

    expect(frames).toHaveLength(12);
    expect(requestedUrl(fetchStub)).toBe(
      `${STATSBOMB_OPEN_DATA_BASE_URL}/three-sixty/3857276.json`,
    );
  });

  it("passes baseUrl through to every helper", async () => {
    const fetchStub = stubFetch("competitions-sample");
    await fetchCompetitions({ fetch: fetchStub, baseUrl: "https://mirror.test/data" });
    expect(requestedUrl(fetchStub)).toBe("https://mirror.test/data/competitions.json");
  });
});
