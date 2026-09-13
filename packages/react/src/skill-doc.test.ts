import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as core from "@pitchkit/core";
import * as skillcorner from "@pitchkit/data-providers/skillcorner";
import * as statsbomb from "@pitchkit/data-providers/statsbomb";
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

const skill = readFileSync(skillPath, "utf8");
const apiReference = readFileSync(join(skillPath, "..", "references", "api.md"), "utf8");

const IMPORT_PATTERN =
  /import\s+\{([^}]+)\}\s+from\s+"(@pitchkit\/(?:react|core|data-providers\/statsbomb|data-providers\/skillcorner))"/g;

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
    // Recipe 5 imports from the two provider subpaths. Without this the
    // newest recipe would be the only unchecked one.
    const missingStatsBomb = importedNames("@pitchkit/data-providers/statsbomb").filter(
      (name) => !(name in statsbomb),
    );
    const missingSkillCorner = importedNames("@pitchkit/data-providers/skillcorner").filter(
      (name) => !(name in skillcorner),
    );
    expect({ statsbomb: missingStatsBomb, skillcorner: missingSkillCorner }).toEqual({
      statsbomb: [],
      skillcorner: [],
    });
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
