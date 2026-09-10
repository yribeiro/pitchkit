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

const skill = readFileSync(skillPath, "utf8");

const IMPORT_PATTERN = /import\s+\{([^}]+)\}\s+from\s+"(@pitchkit\/(?:react|core))"/g;

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

  it("names every pitch type the dimensions registry knows about, and no others", () => {
    const documented = [...skill.matchAll(/\| `"([a-z]+)"`\s+\| \d/g)].map(([, id]) => id);
    expect(documented.sort()).toEqual(Object.keys(core.PITCH_DIMENSIONS).sort());
  });
});
