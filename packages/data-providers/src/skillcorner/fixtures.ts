import { readFileSync } from "node:fs";

/**
 * Test-only fixture loader. Read from disk rather than `import`ed so `tsc`
 * doesn't infer huge literal types, and because the parsers take raw text or
 * `unknown` — which is what a real caller hands them.
 *
 * See `__fixtures__/README.md` for where each file came from.
 */
function readFixture(name: string): string {
  return readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");
}

export const matchesFixture = (): unknown => JSON.parse(readFixture("matches-sample.json"));
export const matchFixture = (): unknown => JSON.parse(readFixture("match-1874553-sample.json"));
export const trackingFixture = (): string => readFixture("tracking-1874553-sample.jsonl");
export const dynamicEventsFixture = (): string => readFixture("dynamic-events-1874553-sample.csv");
export const phasesFixture = (): string => readFixture("phases-1874553-sample.csv");
