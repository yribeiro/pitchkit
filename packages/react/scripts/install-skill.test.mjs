import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CliError,
  DEFAULT_SKILLS_DIR,
  SKILL_NAME,
  installSkill,
  parseArgs,
  run,
  skillSourceDir,
} from "../bin/install-skill.mjs";

// Derived from the module under test rather than `import.meta.url`, which
// vitest hands back as a dev-server URL rather than a file: one.
const packageRoot = resolve(skillSourceDir, "..", "..");

let cwd;

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), "pitchkit-skill-"));
});

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

describe("the bundled skill", () => {
  it("lives where package.json's `files` entry publishes it", async () => {
    const manifest = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    expect(manifest.name).toBe("@pitchkit/react");
    expect(manifest.files).toContain("skills");
    expect(manifest.files).toContain("bin");
    expect(skillSourceDir.endsWith(join("skills", SKILL_NAME))).toBe(true);
  });

  it("declares exactly one bin, so `npx @pitchkit/react` resolves it despite the scope", async () => {
    const manifest = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    expect(Object.keys(manifest.bin)).toEqual(["pitchkit"]);
  });

  // The published Agent Skills frontmatter rules, asserted rather than
  // trusted to review: name and description are the only required fields,
  // and both are validated on load — a violation doesn't degrade discovery,
  // it can reject the skill outright.
  // https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#skill-structure
  describe("its frontmatter", () => {
    const read = async () => {
      const source = await readFile(join(skillSourceDir, "SKILL.md"), "utf8");
      const [, frontmatter, ...rest] = source.split("---\n");
      return { source, frontmatter, body: rest.join("---\n") };
    };

    it("is a well-formed YAML block with the two required fields", async () => {
      const { source, frontmatter } = await read();
      expect(source.startsWith("---\n")).toBe(true);
      expect(frontmatter).toMatch(/^name: /m);
      expect(frontmatter).toMatch(/^description: /m);
    });

    it("uses a name that is lowercase, hyphenated, short, and not reserved", async () => {
      const { frontmatter } = await read();
      const name = /^name: (.*)$/m.exec(frontmatter)?.[1] ?? "";

      expect(name).toMatch(/^[a-z0-9-]+$/);
      expect(name.length).toBeLessThanOrEqual(64);
      expect(name).not.toMatch(/anthropic|claude/);
    });

    it("keeps the description on one line, within 1024 chars, free of XML tags", async () => {
      const { frontmatter } = await read();
      const description = /^description: (.*)$/m.exec(frontmatter)?.[1] ?? "";

      expect(description.length).toBeGreaterThan(0);
      expect(description.length).toBeLessThanOrEqual(1024);
      // Angle brackets read as XML tags, which the spec forbids here — so
      // components get named as "the Pitch component", never as `<Pitch>`.
      expect(description).not.toMatch(/<[^>]+>/);
      // A folded scalar (`description: >-`) is valid YAML but leaves the
      // value empty for the line-oriented parsers some agents use, on the
      // one field that decides whether the skill is ever discovered.
      expect(description).not.toMatch(/^[>|]/);
    });

    it("describes both what the skill does and when to use it, in third person", async () => {
      const { frontmatter } = await read();
      const description = /^description: (.*)$/m.exec(frontmatter)?.[1] ?? "";

      expect(description).toMatch(/\bUse when\b/);
      // Second person is the documented cause of discovery failures — the
      // description is injected into a system prompt, where "you" is the
      // agent, not the reader.
      expect(description).not.toMatch(/\byou(r)?\b/i);
    });

    it("keeps the body under the 500-line guidance, deferring detail to references/", async () => {
      const { body } = await read();
      expect(body.split("\n").length).toBeLessThan(500);
    });
  });
});

describe("parseArgs", () => {
  it("defaults to Claude Code's project skills directory", () => {
    expect(parseArgs(["skills", "install"])).toEqual({
      command: "install",
      dir: DEFAULT_SKILLS_DIR,
      force: false,
      help: false,
    });
  });

  it("accepts the command with or without the `skills` prefix", () => {
    expect(parseArgs(["install"]).command).toBe("install");
  });

  it("reads --dir in both spellings", () => {
    expect(parseArgs(["install", "--dir", "agents/skills"]).dir).toBe("agents/skills");
    expect(parseArgs(["install", "--dir=agents/skills"]).dir).toBe("agents/skills");
  });

  it("rejects a --dir with no value, rather than swallowing the next flag", () => {
    expect(() => parseArgs(["install", "--dir", "--force"])).toThrow(CliError);
    expect(() => parseArgs(["install", "--dir"])).toThrow(CliError);
  });

  it("rejects unknown options and stray arguments", () => {
    expect(() => parseArgs(["install", "--nope"])).toThrow(CliError);
    expect(() => parseArgs(["install", "somewhere"])).toThrow(CliError);
  });

  it("treats a bare invocation as a request for help", () => {
    expect(parseArgs([]).command).toBeNull();
  });
});

describe("installSkill", () => {
  it("copies SKILL.md and its references into <dir>/pitchkit", async () => {
    const { destination, files } = await installSkill({ cwd });

    expect(destination).toBe(join(cwd, DEFAULT_SKILLS_DIR, SKILL_NAME));
    expect(files).toContain("SKILL.md");
    expect(files).toContain("references/api.md");
    await expect(readFile(join(destination, "SKILL.md"), "utf8")).resolves.toContain("# PitchKit");
  });

  it("honours an explicit --dir", async () => {
    const { destination } = await installSkill({ cwd, dir: join("agents", "skills") });
    expect(destination).toBe(join(cwd, "agents", "skills", SKILL_NAME));
  });

  it("refuses to clobber an existing install without --force", async () => {
    await installSkill({ cwd });
    await expect(installSkill({ cwd })).rejects.toThrow(/--force/);
  });

  it("overwrites a stale install with --force", async () => {
    const { destination } = await installSkill({ cwd });
    await writeFile(join(destination, "SKILL.md"), "stale");

    await installSkill({ cwd, force: true });

    await expect(readFile(join(destination, "SKILL.md"), "utf8")).resolves.toContain("# PitchKit");
  });

  it("leaves unrelated files in the skills directory alone", async () => {
    const skillsDir = join(cwd, DEFAULT_SKILLS_DIR, "other-skill");
    await mkdir(skillsDir, { recursive: true });
    await writeFile(join(skillsDir, "SKILL.md"), "someone else's skill");

    await installSkill({ cwd });

    await expect(readFile(join(skillsDir, "SKILL.md"), "utf8")).resolves.toBe(
      "someone else's skill",
    );
  });
});

describe("run", () => {
  const capture = () => {
    const lines = [];
    return { lines, log: (line) => lines.push(line) };
  };

  it("prints help for a bare invocation and exits zero", async () => {
    const { lines, log } = capture();
    await expect(run([], { cwd, log })).resolves.toBe(0);
    expect(lines.join("\n")).toContain("npx @pitchkit/react skills install");
  });

  it("prints the in-node_modules location for `skills path`", async () => {
    const { lines, log } = capture();
    await run(["skills", "path"], { cwd, log });
    expect(lines).toEqual([skillSourceDir]);
  });

  it("reports what it wrote after an install", async () => {
    const { lines, log } = capture();
    await run(["skills", "install"], { cwd, log });

    const output = lines.join("\n");
    expect(output).toContain(join(DEFAULT_SKILLS_DIR, SKILL_NAME));
    expect(output).toContain("SKILL.md");
  });

  it("rejects an unknown command", async () => {
    await expect(run(["skills", "uninstall"], { cwd, log: () => {} })).rejects.toThrow(CliError);
  });
});
