/**
 * Snapshot for the Claude reel: runs the data half of the component Claude
 * wrote (src/reels/claude/DiMariaGoal.tsx) against StatsBomb's live open data,
 * prints what it finds, and saves the raw events it needs, so the render can
 * run that same component without network access.
 *
 *   npm run build --workspace=@pitchkit/data-providers
 *   npm run snapshot:claude-demo --workspace=social
 *
 * The saved file is StatsBomb's own events JSON, trimmed to every shot plus
 * the goal's possession: everything the component reads. It also saves the
 * component's source text, which the reel shows on screen as written.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchMatchEvents,
  isGoal,
  matchEventsUrl,
  passes,
  shots,
} from "@pitchkit/data-providers/statsbomb";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });
const FINAL = 3869685;

// The component's own logic, line for line.
const events = await fetchMatchEvents(FINAL);
const goal = shots(events)
  .filter(isGoal)
  .find((s) => s.player?.name.includes("Di María"));
const buildUp = passes(events)
  .filter((p) => p.possession === goal.possession)
  .slice(-3);
console.log(`goal: ${goal.player.name}, ${goal.minute}:${String(goal.second).padStart(2, "0")}`);
for (const p of buildUp) console.log(`pass: ${p.player.name} -> ${p.pass.recipient?.name}`);

// StatsBomb's raw JSON, so parsing in the render is the same as in the wild.
const raw = await (await globalThis.fetch(matchEventsUrl(FINAL))).json();
const keep = raw.filter((e) => e.type.name === "Shot" || e.possession === goal.possession);
writeFileSync(join(OUT, "claude-demo-events.json"), JSON.stringify(keep));
console.log(`wrote claude-demo-events.json: ${keep.length} of ${raw.length} events`);

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "src", "reels", "claude", "DiMariaGoal.tsx"),
  "utf8",
);
writeFileSync(join(OUT, "claude-demo-code.json"), JSON.stringify({ source }));
console.log(`wrote claude-demo-code.json: ${source.split("\n").length} lines`);
