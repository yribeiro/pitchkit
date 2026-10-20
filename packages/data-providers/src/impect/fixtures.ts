import { readFileSync } from "node:fs";

/**
 * Test-only fixture loader. Read from disk rather than `import`ed, because the
 * parsers take `unknown`, which is what a real caller hands them.
 *
 * **These fixtures are hand-made**, unlike every other provider's. Impect's
 * terms forbid reproducing or redistributing their data, so nothing here is
 * copied from it. See `__fixtures__/README.md`.
 */
export function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`./__fixtures__/${name}.json`, import.meta.url), "utf8"));
}

export const eventsFixture = (): unknown => loadFixture("events-sample");
export const matchesFixture = (): unknown => loadFixture("matches-sample");
export const squadsFixture = (): unknown => loadFixture("squads-sample");
export const playersFixture = (): unknown => loadFixture("players-sample");
export const iterationsFixture = (): unknown => loadFixture("iterations-sample");
export const lineupsFixture = (): unknown => loadFixture("lineups-sample");
