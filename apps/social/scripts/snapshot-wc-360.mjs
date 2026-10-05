/**
 * Snapshot for reel 06: StatsBomb 360 freeze frames from the 2022 World Cup
 * final, for a time-lapse of who controls the space.
 *
 *   npm run build --workspace=@pitchkit/data-providers
 *   npm run snapshot:wc-360 --workspace=social
 *
 * Every frame is turned to Argentina attacking left to right (France's events
 * are flipped), and each player is tagged by team rather than "teammate of
 * the actor". To keep the file small it keeps every frame within a minute of
 * a goal or of Kolo Muani's late chance, and one frame per 6 seconds of play
 * otherwise. Coordinates are stored as integers in half-units. `n` is the
 * actor's shirt number; the keepers' numbers sit alongside the frames.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchLineups,
  fetchMatchEvents,
  fetchMatchThreeSixty,
  isGoal,
  isShot,
} from "@pitchkit/data-providers/statsbomb";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });

const MATCH = 3869685;
const HOME = "Argentina";
const events = await fetchMatchEvents(MATCH);
const frames = await fetchMatchThreeSixty(MATCH);
const byId = new Map(events.map((e) => [e.id, e]));
const lineups = await fetchLineups(MATCH);
const jersey = new Map(lineups.flatMap((t) => t.lineup.map((p) => [p.player_id, p.jersey_number])));
// 360 players are anonymous; only the actor (from the event) and each side's
// keeper (one each, all match) can be named, so only they carry a number.
const keeperNumber = (team) =>
  lineups
    .find((t) => t.team_name === team)
    .lineup.find((p) => p.positions?.some((pos) => pos.position === "Goalkeeper")).jersey_number;

const half = (v) => Math.round(v * 2);
/** The event's minute, as StatsBomb numbers it within its period. */
const minuteOf = (e) => e.minute + e.second / 60;

const keyMoments = events
  .filter((e) => e.period <= 4 && isShot(e) && (isGoal(e) || e.shot.statsbomb_xg > 0.25))
  .map((e) => ({ period: e.period, minute: minuteOf(e) }));
const nearKey = (period, minute) =>
  keyMoments.some((k) => k.period === period && minute > k.minute - 1 && minute < k.minute + 0.4);

const rows = [];
let lastKept = -Infinity;
for (const f of frames) {
  const e = byId.get(f.event_uuid);
  if (!e || e.period > 4 || !e.location) continue;
  const minute = minuteOf(e);
  const t = e.period * 1000 + minute * 60;
  if (!nearKey(e.period, minute) && t - lastKept < 6) continue;
  lastKept = t;
  const flip = e.team.name !== HOME;
  const at = ([x, y]) => (flip ? [120 - x, 80 - y] : [x, y]);
  const [bx, by] = at(e.location);
  const area = [];
  for (let i = 0; i + 1 < f.visible_area.length; i += 2) {
    const [x, y] = at([f.visible_area[i], f.visible_area[i + 1]]);
    area.push(half(x), half(y));
  }
  const players = [];
  for (const p of f.freeze_frame) {
    const [x, y] = at(p.location);
    const argentina = p.teammate === !flip;
    // flags: 1 = Argentina, 2 = the actor, 4 = a keeper
    players.push(half(x), half(y), (argentina ? 1 : 0) | (p.actor ? 2 : 0) | (p.keeper ? 4 : 0));
  }
  rows.push({
    p: e.period,
    n: e.player ? jersey.get(e.player.id) : null,
    m: Math.round(minute * 100) / 100,
    b: [half(bx), half(by)],
    a: area,
    f: players,
  });
}

rows.sort((a, b) => a.p - b.p || a.m - b.m);
writeFileSync(
  join(OUT, "wc-360.json"),
  JSON.stringify({
    keepers: { argentina: keeperNumber(HOME), france: keeperNumber("France") },
    frames: rows,
  }),
);
console.log(
  `wrote wc-360.json: ${rows.length} of ${frames.length} frames, ${(JSON.stringify(rows).length / 1024).toFixed(0)} KB`,
);
