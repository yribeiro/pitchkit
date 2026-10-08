/**
 * Snapshot for reel 06's goals cut: the moves behind every goal of the 2022
 * World Cup final, each with the StatsBomb 360 frame StatsBomb captured for it.
 *
 *   npm run build --workspace=@pitchkit/data-providers
 *   npm run snapshot:wc-goals360 --workspace=social
 *
 * Open-play goals keep the last three actions of the scoring possession, then
 * the shot. Penalties keep the two actions before the foul (or handball) that
 * gave the penalty, the foul itself, then the spot kick. Consecutive carries
 * and dribbles by one player are merged into one carry. Everything is in
 * Argentina's frame (Argentina attack towards x = 120), like the other
 * wc-*.json snapshots. A step without a 360 frame has `frame: null`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchLineups,
  fetchMatchEvents,
  fetchMatchThreeSixty,
} from "@pitchkit/data-providers/statsbomb";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });
const round = (n) => Math.round(n * 10) / 10;

const MATCH = 3869685;
const HOME = "Argentina";
const events = await fetchMatchEvents(MATCH);
const frames = await fetchMatchThreeSixty(MATCH);
const lineups = await fetchLineups(MATCH);
const frameOf = new Map(frames.map((f) => [f.event_uuid, f]));
const jersey = new Map(lineups.flatMap((t) => t.lineup.map((p) => [p.player_id, p.jersey_number])));
const nickname = new Map(
  lineups.flatMap((t) => t.lineup.map((p) => [p.player_id, p.player_nickname ?? p.player_name])),
);
/** What fans call them, as in snapshot-wc-final.mjs. */
const SHORT = {
  "Randal Kolo Muani": "Kolo Muani",
  "Lautaro Javier Martínez": "Lautaro",
  "Damián Emiliano Martínez": "E. Martínez",
  "Julián Álvarez": "Álvarez",
  "Enzo Fernandez": "Enzo",
  "Alexis Mac Allister": "Mac Allister",
};
const nameOf = (ref) => {
  if (!ref) return null;
  if (SHORT[ref.name]) return SHORT[ref.name];
  const name = nickname.get(ref.id) ?? ref.name;
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
};

/** Event coordinates are in the acting team's frame; turn them into Argentina's. */
const toArg = (team, [x, y]) => (team === HOME ? [x, y] : [120 - x, 80 - y]);

function frame360(e) {
  const f = frameOf.get(e.id);
  if (!f) return null;
  const area = [];
  for (let i = 0; i + 1 < f.visible_area.length; i += 2) {
    const [x, y] = toArg(e.team.name, [f.visible_area[i], f.visible_area[i + 1]]);
    area.push([round(x), round(y)]);
  }
  const players = f.freeze_frame.map((p) => {
    const [x, y] = toArg(e.team.name, p.location);
    const team = p.teammate === (e.team.name === HOME) ? "A" : "F";
    return { x: round(x), y: round(y), team, actor: p.actor, keeper: p.keeper };
  });
  return { area, players };
}

function step(e, kind, end) {
  const [x, y] = toArg(e.team.name, e.location);
  const [endX, endY] = end ? toArg(e.team.name, end) : [x, y];
  return {
    kind,
    team: e.team.name === HOME ? "A" : "F",
    player: nameOf(e.player),
    n: jersey.get(e.player?.id) ?? null,
    to: kind === "pass" ? nameOf(e.pass?.recipient) : null,
    outcome: kind === "shot" ? e.shot.outcome.name : null,
    clock: e.minute * 60 + e.second,
    x: round(x),
    y: round(y),
    endX: round(endX),
    endY: round(endY),
    frame: frame360(e),
  };
}

/** The attacking team's on-ball actions in a possession, carries merged per player. */
function actions(possession, team, before) {
  const out = [];
  for (const e of events) {
    if (e === before) break;
    if (e.possession !== possession || e.team.name !== team || !e.location) continue;
    const type = e.type.name;
    if (type === "Pass") out.push(step(e, "pass", e.pass.end_location));
    else if (type === "Shot") out.push(step(e, "shot", e.shot.end_location));
    else if (type === "Carry" || type === "Dribble") {
      const end = type === "Carry" ? e.carry.end_location : e.location;
      const last = out.at(-1);
      if (last && last.kind === "carry" && last.player === nameOf(e.player)) {
        const [endX, endY] = toArg(team, end);
        last.endX = round(endX);
        last.endY = round(endY);
        last.frame ??= frame360(e);
      } else out.push(step(e, "carry", end));
    }
  }
  // A carry of a yard or two is just a touch: drop it.
  return out.filter((s) => s.kind !== "carry" || Math.hypot(s.endX - s.x, s.endY - s.y) > 2);
}

const goals = events.filter(
  (e) => e.period <= 4 && e.type.name === "Shot" && e.shot.outcome.name === "Goal",
);
const result = goals.map((g) => {
  const team = g.team.name;
  const penalty = g.shot.type.name === "Penalty";
  const shot = step(g, "goal", g.shot.end_location);
  let steps;
  if (!penalty) {
    steps = [...actions(g.possession, team, g).slice(-3), shot];
  } else {
    const i = events.indexOf(g);
    const foul = events
      .slice(0, i)
      .findLast((e) => e.type.name === "Foul Committed" && e.foul_committed?.penalty);
    if (!foul) throw new Error(`no penalty foul before ${g.minute}'`);
    const won = step(foul, "foul", null);
    won.foul = foul.foul_committed?.type?.name === "Handball" ? "handball" : "foul";
    steps = [...actions(foul.possession, team, foul).slice(-2), won, shot];
  }
  return {
    team: team === HOME ? "A" : "F",
    scorer: nameOf(g.player),
    n: jersey.get(g.player.id),
    penalty,
    period: g.period,
    clock: g.minute * 60 + g.second,
    steps,
  };
});

const data = { goals: result };
writeFileSync(join(OUT, "wc-goals360.json"), JSON.stringify(data));
for (const g of result) {
  console.log(
    `${Math.floor(g.clock / 60)}' ${g.scorer}${g.penalty ? " (pen)" : ""}: ` +
      g.steps
        .map(
          (s) =>
            `${s.kind}:${s.player}${s.to ? "→" + s.to : ""}[${s.frame ? s.frame.players.length : "–"}]`,
        )
        .join("  "),
  );
}
console.log(`wrote wc-goals360.json, ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`);
