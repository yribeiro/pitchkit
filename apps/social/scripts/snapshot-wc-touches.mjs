/**
 * Snapshot for reel 06's network cut: every on-ball touch in the 2022 World
 * Cup final, by player, so the reel can drift each player to their recent
 * average position (the pass-network idea, without the lines).
 *
 *   npm run build --workspace=@pitchkit/data-providers
 *   npm run snapshot:wc-touches --workspace=social
 *
 * Touches are turned to Argentina attacking left to right. `touches` is flat:
 * [player index, period, minute x 10, x x 2, y x 2] per touch.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchLineups, fetchMatchEvents } from "@pitchkit/data-providers/statsbomb";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });

const MATCH = 3869685;
const HOME = "Argentina";
const events = await fetchMatchEvents(MATCH);
const lineups = await fetchLineups(MATCH);
const jersey = new Map(lineups.flatMap((t) => t.lineup.map((p) => [p.player_id, p.jersey_number])));

const ON_BALL = new Set([
  "Pass",
  "Ball Receipt*",
  "Carry",
  "Shot",
  "Dribble",
  "Ball Recovery",
  "Interception",
  "Clearance",
  "Block",
  "Duel",
  "Goal Keeper",
  "Miscontrol",
  "Dispossessed",
]);

const players = [];
const index = new Map();
const touches = [];
for (const e of events) {
  if (e.period > 4 || !e.player || !e.location || !ON_BALL.has(e.type.name)) continue;
  if (!index.has(e.player.id)) {
    index.set(e.player.id, players.length);
    players.push({
      team: e.team.name === HOME ? "A" : "F",
      n: jersey.get(e.player.id) ?? null,
    });
  }
  const flip = e.team.name !== HOME;
  const x = flip ? 120 - e.location[0] : e.location[0];
  const y = flip ? 80 - e.location[1] : e.location[1];
  touches.push(
    index.get(e.player.id),
    e.period,
    Math.round((e.minute + e.second / 60) * 10),
    Math.round(x * 2),
    Math.round(y * 2),
  );
}

const data = { players, touches };
writeFileSync(join(OUT, "wc-touches.json"), JSON.stringify(data));
console.log(
  `wrote wc-touches.json: ${players.length} players, ${touches.length / 5} touches, ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`,
);
