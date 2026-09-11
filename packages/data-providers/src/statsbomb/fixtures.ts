import { readFileSync } from "node:fs";

/**
 * Test-only fixture loader. Read from disk rather than `import`ed as JSON so
 * `tsc` doesn't have to infer a 45 KB literal type on every typecheck — and
 * because the parsers take `unknown`, which is what a real caller hands them.
 *
 * See `__fixtures__/README.md` for where each file came from.
 */
export function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`./__fixtures__/${name}.json`, import.meta.url), "utf8"));
}

export const eventsFixture = (): unknown => loadFixture("events-15946-sample");
export const competitionsFixture = (): unknown => loadFixture("competitions-sample");
export const matchesFixture = (): unknown => loadFixture("matches-43-106-sample");
export const lineupsFixture = (): unknown => loadFixture("lineups-15946-sample");

// A second, smaller match (3857276) whose events and 360 frames were both
// sampled together, so `event_uuid`/`id` actually join — match 15946 (above)
// predates 360 tracking and has none.
export const threeSixtyMatchEventsFixture = (): unknown => loadFixture("events-3857276-sample");
export const threeSixtyFixture = (): unknown => loadFixture("three-sixty-3857276-sample");
