import { readFileSync } from "node:fs";

/**
 * Test-only fixture loader. Read from disk rather than `import`ed, because the
 * parsers take raw CSV text, which is what a real caller hands them.
 *
 * See `__fixtures__/README.md` for where each file came from.
 */
function readFixture(name: string): string {
  return readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");
}

export const eventsFixture = (): string => readFixture("events-game1-sample.csv");
export const game2EventsFixture = (): string => readFixture("events-game2-sample.csv");
export const homeTrackingFixture = (): string => readFixture("tracking-game1-home-sample.csv");
export const awayTrackingFixture = (): string => readFixture("tracking-game1-away-sample.csv");
export const game2AwayTrackingFixture = (): string => readFixture("tracking-game2-away-header.csv");
export const homeKickOffFixture = (): string => readFixture("tracking-game1-home-kickoff.csv");
export const awayKickOffFixture = (): string => readFixture("tracking-game1-away-kickoff.csv");
