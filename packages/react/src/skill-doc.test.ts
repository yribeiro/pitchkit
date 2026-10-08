import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as core from "@pitchkit/core";
import * as react from "./index.js";

/**
 * The bundled Agent Skill's whole purpose is that an agent doesn't have to
 * guess PitchKit's API — so a recipe importing something we removed (or never
 * shipped) is the one failure mode that matters most. Rather than duplicating
 * the recipes here, where the copies could drift apart silently, this reads
 * SKILL.md itself and checks every name it imports still exists.
 */
// Resolved from cwd rather than `import.meta.url`, which vitest hands back as
// a dev-server URL; the second candidate covers a run started from the repo
// root instead of this package.
const skillPath = [
  join(process.cwd(), "skills", "pitchkit", "SKILL.md"),
  join(process.cwd(), "packages", "react", "skills", "pitchkit", "SKILL.md"),
].find((candidate) => existsSync(candidate));

if (!skillPath) throw new Error("Could not locate skills/pitchkit/SKILL.md from " + process.cwd());

// Re-bound so the narrowing survives into the helper below; TypeScript won't
// carry a `string | undefined` narrowing across a function boundary.
const skillFile: string = skillPath;

const skill = readFileSync(skillFile, "utf8");
const apiReference = readFileSync(join(skillFile, "..", "references", "api.md"), "utf8");

/**
 * Names a `@pitchkit/data-providers` subpath re-exports, read straight from
 * its barrel file's source.
 *
 * Deliberately text, not an import. The package's entry points resolve to
 * `dist/`, and CI runs `lint` and `test` *before* `build` — so importing it
 * here fails on a clean checkout, exactly as `vitest.config.ts` already
 * notes for `@pitchkit/core`. Reading the barrel needs no build, no
 * dependency edge, and no alias, and it is the same trick this file already
 * plays on SKILL.md.
 */
function providerExports(
  provider: "statsbomb" | "skillcorner" | "wyscout" | "metrica",
): Set<string> {
  // skillPath is <pkg>/skills/pitchkit/SKILL.md, so three levels up is the
  // react package and its sibling is data-providers.
  const barrel = join(
    skillFile,
    "..",
    "..",
    "..",
    "..",
    "data-providers",
    "src",
    provider,
    "index.ts",
  );
  const source = readFileSync(barrel, "utf8");

  const names = new Set<string>();
  // Value re-exports only — `export type { ... }` names aren't importable
  // as values, and the recipes only import values.
  for (const [, clause] of source.matchAll(/(?<!type\s)export\s+\{([^}]+)\}\s+from/g)) {
    if (clause === undefined) continue;
    for (const specifier of clause.split(",")) {
      const name = specifier
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

const IMPORT_PATTERN =
  /import\s+\{([^}]+)\}\s+from\s+"(@pitchkit\/(?:react|core|data-providers\/statsbomb|data-providers\/skillcorner|data-providers\/wyscout|data-providers\/metrica))"/g;

function importedNames(packageName: string): string[] {
  const names = new Set<string>();
  for (const [, clause, from] of skill.matchAll(IMPORT_PATTERN)) {
    if (from !== packageName || clause === undefined) continue;
    for (const specifier of clause.split(",")) {
      const name = specifier
        .trim()
        .split(/\s+as\s+/)[0]
        ?.trim();
      if (name) names.add(name);
    }
  }
  return [...names].sort();
}

describe("the bundled skill's recipes", () => {
  it("import something from each package, so the checks below aren't vacuous", () => {
    expect(importedNames("@pitchkit/react").length).toBeGreaterThan(4);
    expect(importedNames("@pitchkit/core").length).toBeGreaterThan(0);
  });

  it("only import values @pitchkit/react actually exports", () => {
    const missing = importedNames("@pitchkit/react").filter((name) => !(name in react));
    expect(missing).toEqual([]);
  });

  it("only import values @pitchkit/core actually exports", () => {
    const missing = importedNames("@pitchkit/core").filter((name) => !(name in core));
    expect(missing).toEqual([]);
  });

  it("only import values @pitchkit/data-providers actually exports", () => {
    // Recipe 5 imports from all four provider subpaths. Without this the
    // newest recipe would be the only unchecked one.
    const statsbomb = providerExports("statsbomb");
    const skillcorner = providerExports("skillcorner");
    const wyscout = providerExports("wyscout");
    const metrica = providerExports("metrica");
    expect(statsbomb.size).toBeGreaterThan(10);
    expect(skillcorner.size).toBeGreaterThan(10);
    expect(wyscout.size).toBeGreaterThan(10);
    expect(metrica.size).toBeGreaterThan(10);

    expect({
      statsbomb: importedNames("@pitchkit/data-providers/statsbomb").filter(
        (name) => !statsbomb.has(name),
      ),
      skillcorner: importedNames("@pitchkit/data-providers/skillcorner").filter(
        (name) => !skillcorner.has(name),
      ),
      wyscout: importedNames("@pitchkit/data-providers/wyscout").filter(
        (name) => !wyscout.has(name),
      ),
      metrica: importedNames("@pitchkit/data-providers/metrica").filter(
        (name) => !metrica.has(name),
      ),
    }).toEqual({ statsbomb: [], skillcorner: [], wyscout: [], metrica: [] });
  });

  it("names every pitch type the dimensions registry knows about, and no others", () => {
    const documented = [...skill.matchAll(/\| `"([a-z]+)"`\s+\| \d/g)].map(([, id]) => id);
    expect(documented.sort()).toEqual(Object.keys(core.PITCH_DIMENSIONS).sort());
  });

  it("never lists a real pitch type among the things that don't exist", () => {
    // This one has bitten: `"skillcorner"` shipped in core but stayed in the
    // "things that do not exist, however plausible" list for a release, so an
    // agent reading top-down would refuse to use a real feature. The table
    // check above passes in that state, because the table was correct — only
    // the prose contradicted it.
    const denials = skill.slice(
      skill.indexOf("Things that do **not** exist"),
      skill.indexOf("## Package split"),
    );
    expect(denials).not.toBe("");

    const wronglyDenied = Object.keys(core.PITCH_DIMENSIONS).filter((type) =>
      denials.includes(`"${type}"`),
    );
    expect(wronglyDenied).toEqual([]);
  });

  it("documents api.md's @pitchkit/core helpers against the real exports", () => {
    // api.md carries no import statements, so the checks above never read it.
    // Its "exports worth calling directly" section names functions in prose;
    // those are what drift.
    const section = apiReference.slice(
      apiReference.indexOf("## `@pitchkit/core` exports worth calling directly"),
      apiReference.indexOf("### Not for consumer code"),
    );
    expect(section).not.toBe("");

    // Two forms, matched separately so prose can't leak in. Call form
    // (`cropForHalf(`) anywhere in the section, and bare backticked names —
    // but only inside the Aggregation/Theming bullets, which list helpers
    // without parentheses. Matching bare names section-wide would pick up
    // parameter names like `overrides` and prose like `tooltip`.
    const namesIn = (text: string, pattern: RegExp): string[] =>
      [...text.matchAll(pattern)]
        .map(([, name]) => name)
        .filter((name): name is string => name !== undefined);

    const callForm = namesIn(section, /`([a-z][A-Za-z0-9]*)\(/g);

    const bulletBlock = section.slice(
      section.indexOf("**Aggregation**"),
      section.indexOf("**Types**"),
    );
    const bareNames = namesIn(bulletBlock, /`([a-z][A-Za-z0-9]*)`/g);

    expect(callForm.length).toBeGreaterThan(2);
    expect(bareNames.length).toBeGreaterThan(8);

    const missing = [...new Set([...callForm, ...bareNames])].filter((name) => !(name in core));
    expect(missing).toEqual([]);
  });
});
