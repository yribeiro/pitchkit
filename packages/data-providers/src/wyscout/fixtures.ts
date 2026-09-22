import { readFileSync } from "node:fs";

/**
 * Test-only fixture loader. Read from disk rather than `import`ed as JSON so
 * `tsc` doesn't have to infer a large literal type on every typecheck — and
 * because the parsers take `unknown`, which is what a real caller hands them.
 *
 * See `__fixtures__/README.md` for where each file came from.
 */
export function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`./__fixtures__/${name}.json`, import.meta.url), "utf8"));
}

export const matchFixture = (): unknown => loadFixture("match-2499841-sample");
export const competitionsFixture = (): unknown => loadFixture("competitions");
