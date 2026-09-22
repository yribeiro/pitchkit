import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { DataProviderError } from "../errors.js";
import {
  fetchCompetitions,
  fetchMatch,
  fetchMatchEvents,
  fetchTeams,
  loadMatch,
  matchUrl,
  referenceUrl,
  WYSCOUT_EVENTS_BASE_URL,
  WYSCOUT_REFERENCE_BASE_URL,
} from "./load.js";

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

describe("base URLs", () => {
  it("serves events and reference data from different hosts, on purpose", () => {
    // Events come from a mirror that splits the official 77 MB archive per
    // match; the small reference files come from figshare itself. Collapsing
    // these to one host would break one of the two.
    expect(new URL(WYSCOUT_EVENTS_BASE_URL).host).not.toBe(
      new URL(WYSCOUT_REFERENCE_BASE_URL).host,
    );
    expect(WYSCOUT_REFERENCE_BASE_URL).toContain("figshare");
  });
});

describe("URL builders", () => {
  it("builds a per-match event URL", () => {
    expect(matchUrl(2499841)).toBe(`${WYSCOUT_EVENTS_BASE_URL}/2499841.json`);
  });

  it("addresses figshare reference files by their opaque numeric id", () => {
    // figshare has no filename in the path, so the id cannot be derived and
    // is recorded in WYSCOUT_REFERENCE_FILE_IDS.
    expect(referenceUrl("competitions")).toBe(`${WYSCOUT_REFERENCE_BASE_URL}/15073685`);
    expect(referenceUrl("teams")).not.toBe(referenceUrl("competitions"));
  });

  it("honours a baseUrl override and tolerates a trailing slash", () => {
    expect(matchUrl(1, { baseUrl: "https://example.test/files/" })).toBe(
      "https://example.test/files/1.json",
    );
    expect(matchUrl(1, { baseUrl: "https://example.test/files///" })).toBe(
      "https://example.test/files/1.json",
    );
  });

  it("lets the reference host be overridden independently of the event host", () => {
    const options = { baseUrl: "https://events.test", referenceBaseUrl: "https://ref.test" };
    expect(matchUrl(7, options)).toBe("https://events.test/7.json");
    expect(referenceUrl("teams", options)).toBe("https://ref.test/15073697");
  });

  it("falls back to baseUrl for reference files when only baseUrl is given", () => {
    // One mirror hosting everything is a legitimate setup.
    expect(referenceUrl("competitions", { baseUrl: "https://mirror.test" })).toBe(
      "https://mirror.test/15073685",
    );
  });
});

describe("fetchMatch", () => {
  it("requests the match file and returns parsed events, teams and squads", async () => {
    const fetchStub = stubFetch("match-2499841-sample");
    const match = await fetchMatch(2499841, { fetch: fetchStub });

    expect(requestedUrl(fetchStub)).toBe(`${WYSCOUT_EVENTS_BASE_URL}/2499841.json`);
    expect(match.events).toHaveLength(27);
    expect(Object.keys(match.teams)).toHaveLength(2);
  });

  it("fetchMatchEvents returns just the events", async () => {
    const fetchStub = stubFetch("match-2499841-sample");
    const events = await fetchMatchEvents(2499841, { fetch: fetchStub });
    expect(events).toHaveLength(27);
  });
});

describe("reference loaders", () => {
  it("fetchCompetitions reads figshare's competitions file", async () => {
    const fetchStub = stubFetch("competitions");
    const competitions = await fetchCompetitions({ fetch: fetchStub });

    expect(requestedUrl(fetchStub)).toBe(`${WYSCOUT_REFERENCE_BASE_URL}/15073685`);
    expect(competitions).toHaveLength(7);
  });

  it("fetchTeams asks for the teams file, not the competitions one", async () => {
    const fetchStub = stubFetch("competitions");
    // The fixture is the wrong shape for teams only in that wyId is present
    // in both, so this asserts the URL rather than the body.
    await fetchTeams({ fetch: fetchStub });
    expect(requestedUrl(fetchStub)).toBe(`${WYSCOUT_REFERENCE_BASE_URL}/15073697`);
  });
});

describe("failures", () => {
  it("surfaces a schema failure when the URL points at the wrong file", async () => {
    const fetchStub = stubFetch("competitions");
    const error = (await loadMatch("https://example.test/wrong.json", {
      fetch: fetchStub,
    }).catch((e: unknown) => e)) as DataProviderError;

    expect(error).toBeInstanceOf(DataProviderError);
    expect(error.kind).toBe("schema");
    expect(error.message).toMatch(/per-match file/);
  });

  it("reports a non-2xx response as an http failure", async () => {
    const fetchStub = vi.fn(async () => new Response("nope", { status: 404 }));
    const error = (await fetchMatch(1, { fetch: fetchStub }).catch(
      (e: unknown) => e,
    )) as DataProviderError;

    expect(error.kind).toBe("http");
    expect(error.status).toBe(404);
  });
});
