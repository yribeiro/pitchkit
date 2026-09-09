// The `npx @pitchkit/react skills install` implementation, kept separate from
// bin/pitchkit.mjs so it can be unit-tested without spawning a process or
// doing the "am I the main module?" dance (which npx's bin symlinks make
// unreliable). Zero dependencies on purpose: this runs in a consumer's
// project, via npx, before anything of ours is necessarily installed.
import { access, cp, mkdir, readdir } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SKILL_NAME = "pitchkit";

/**
 * Claude Code's project-scoped skills directory. Chosen as the default
 * because it's the one convention with a settled on-disk layout; every
 * other agent gets pointed at `--dir` in the help text rather than us
 * guessing at a location it may not read.
 */
export const DEFAULT_SKILLS_DIR = join(".claude", "skills");

/** `bin/` -> the package root, so this resolves inside a consumer's node_modules too. */
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export const skillSourceDir = join(packageRoot, "skills", SKILL_NAME);

export class CliError extends Error {}

export function formatHelp() {
  return `pitchkit — ships the PitchKit Agent Skill with the package you installed

Usage
  npx @pitchkit/react skills install [options]   Copy the skill into your project
  npx @pitchkit/react skills path                Print the skill's location in node_modules
  npx @pitchkit/react --help

Options
  --dir <path>   Skills directory to install into (default: ${DEFAULT_SKILLS_DIR})
  --force        Overwrite an existing installation
  -h, --help     Show this message

The skill is copied to <dir>/${SKILL_NAME}/. The default suits Claude Code; for another
agent, point --dir at wherever it reads skills from, or use \`skills path\` and read
SKILL.md directly.`;
}

export function parseArgs(argv) {
  const options = { command: null, dir: DEFAULT_SKILLS_DIR, force: false, help: false };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "--force" || arg === "-f") {
      options.force = true;
    } else if (arg === "--dir") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("-")) {
        throw new CliError("--dir needs a path, e.g. --dir .claude/skills");
      }
      options.dir = value;
      i += 1;
    } else if (arg.startsWith("--dir=")) {
      const value = arg.slice("--dir=".length);
      if (value === "") throw new CliError("--dir needs a path, e.g. --dir .claude/skills");
      options.dir = value;
    } else if (arg.startsWith("-")) {
      throw new CliError(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  // `skills install` and a bare `install` both work — the former is what the
  // docs show, the latter is what people type.
  const words = positional[0] === "skills" ? positional.slice(1) : positional;
  options.command = words[0] ?? null;

  if (words.length > 1) {
    throw new CliError(`Unexpected argument: ${words[1]}`);
  }

  return options;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copies `skills/pitchkit/` out of the installed package and into the
 * consumer's project. Returns the destination directory and the files written.
 */
export async function installSkill({
  cwd = process.cwd(),
  dir = DEFAULT_SKILLS_DIR,
  force = false,
} = {}) {
  if (!(await exists(skillSourceDir))) {
    throw new CliError(
      `Could not find the bundled skill at ${skillSourceDir}. ` +
        "Is @pitchkit/react installed, and new enough to ship one?",
    );
  }

  const skillsDir = isAbsolute(dir) ? dir : resolve(cwd, dir);
  const destination = join(skillsDir, SKILL_NAME);

  if ((await exists(destination)) && !force) {
    throw new CliError(
      `${relative(cwd, destination) || destination} already exists. Re-run with --force to overwrite it.`,
    );
  }

  await mkdir(skillsDir, { recursive: true });
  await cp(skillSourceDir, destination, { recursive: true, force: true });

  // Plain codepoint sort, so SKILL.md leads and the references/ paths follow.
  return { destination, files: (await listFiles(destination)).sort() };
}

async function listFiles(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(join(dir, entry.name), name)));
    } else {
      files.push(name);
    }
  }
  return files;
}

export async function run(argv, { cwd = process.cwd(), log = console.log } = {}) {
  const options = parseArgs(argv);

  if (options.help || options.command === null || options.command === "help") {
    log(formatHelp());
    return 0;
  }

  if (options.command === "path") {
    log(skillSourceDir);
    return 0;
  }

  if (options.command !== "install") {
    throw new CliError(`Unknown command: ${options.command}\n\n${formatHelp()}`);
  }

  const { destination, files } = await installSkill({
    cwd,
    dir: options.dir,
    force: options.force,
  });
  const shown = relative(cwd, destination) || destination;

  log(`Installed the PitchKit skill to ${shown}`);
  for (const file of files) log(`  ${shown}/${file}`);
  log("");
  log("Start a new agent session so it picks the skill up.");

  return 0;
}
