/**
 * Snapshot for reel 05: the 2022 World Cup final, Argentina 3–3 France
 * (Argentina won 4–2 on penalties), from StatsBomb open data.
 *
 *   npm run build --workspace=@pitchkit/data-providers
 *   npm run snapshot:wc-final --workspace=social
 *
 * Every shot in open play and extra time, the build-up behind each goal, the
 * freeze frame of Kolo Muani's late chance, the shootout kick by kick, and a
 * momentum series (the docs recipe: on-ball events in the attacking third,
 * Argentina +1 / France -1 per minute, smoothed over three minutes).
 * Coordinates are StatsBomb units with each team attacking left to right.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchLineups,
  fetchMatchEvents,
  isCarry,
  isGoal,
  isPass,
  shots,
} from "@pitchkit/data-providers/statsbomb";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });
const round = (n, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;
const fail = (msg) => {
  throw new Error(msg);
};

const MATCH = 3869685;
const HOME = "Argentina";
const AWAY = "France";
const events = await fetchMatchEvents(MATCH);
const lineups = await fetchLineups(MATCH);
const nickname = new Map(
  lineups.flatMap((t) => t.lineup.map((p) => [p.player_id, p.player_nickname ?? p.player_name])),
);
/** What fans call them, where the surname alone is ambiguous or odd. */
const SHORT = {
  "Randal Kolo Muani": "Kolo Muani",
  "Lautaro Javier Martínez": "Lautaro",
  "Damián Emiliano Martínez": "E. Martínez",
  "Julián Álvarez": "Álvarez",
  "Enzo Fernandez": "Enzo",
  "Alexis Mac Allister": "Mac Allister",
};
const nameOf = (ref) => {
  if (!ref) return "Unknown";
  if (SHORT[ref.name]) return SHORT[ref.name];
  const name = nickname.get(ref.id) ?? ref.name;
  const parts = name.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
};
/** Match clock in seconds; StatsBomb's minute already runs on through each period. */
const clockOf = (e) => e.minute * 60 + e.second;

const allShots = shots(events);
const inPlay = allShots.filter((s) => s.period <= 4);
const shootout = allShots.filter((s) => s.period === 5);

const shotRows = inPlay.map((s) => ({
  team: s.team.name,
  player: nameOf(s.player),
  period: s.period,
  clock: clockOf(s),
  x: round(s.x),
  y: round(s.y),
  endX: round(s.endX),
  endY: round(s.endY),
  xg: round(s.shot.statsbomb_xg, 3),
  outcome: s.shot.outcome.name,
  penalty: s.shot.type.name === "Penalty",
  goal: isGoal(s),
}));

function goalChain(goal) {
  const possession = events.filter((e) => e.possession === goal.possession);
  const upToGoal = possession.slice(0, possession.indexOf(goal) + 1);
  const attacking = upToGoal.filter((e) => e.team.id === e.possession_team.id);
  return attacking
    .filter((e) => isPass(e) || (isCarry(e) && Math.hypot(e.endX - e.x, e.endY - e.y) > 2))
    .map((e) => ({
      kind: isPass(e) ? "pass" : "carry",
      player: nameOf(e.player),
      x: round(e.x),
      y: round(e.y),
      endX: round(e.endX),
      endY: round(e.endY),
      clock: clockOf(e),
    }));
}

const goals = inPlay.filter(isGoal).map((g) => ({
  team: g.team.name,
  scorer: nameOf(g.player),
  period: g.period,
  clock: clockOf(g),
  penalty: g.shot.type.name === "Penalty",
  xg: round(g.shot.statsbomb_xg, 3),
  x: round(g.x),
  y: round(g.y),
  endX: round(g.endX),
  endY: round(g.endY),
  moves: g.shot.type.name === "Penalty" ? [] : goalChain(g),
}));
if (goals.length !== 6) fail(`Expected 6 goals in play, found ${goals.length}`);

// Kolo Muani's chance in the last minute of extra time, saved by Martínez.
const save =
  inPlay.find((s) => nameOf(s.player) === "Kolo Muani" && s.period === 4) ??
  fail("No Kolo Muani shot in extra time");
const keeperOf = (team) => {
  const p = lineups
    .find((t) => t.team_name === team)
    ?.lineup.find((p) => p.positions?.some((pos) => pos.position === "Goalkeeper"));
  return p && { id: p.player_id, name: p.player_name };
};
const theSave = {
  player: nameOf(save.player),
  keeper: nameOf(keeperOf(HOME)),
  clock: clockOf(save),
  xg: round(save.shot.statsbomb_xg, 3),
  x: round(save.x),
  y: round(save.y),
  endX: round(save.endX),
  endY: round(save.endY),
  outcome: save.shot.outcome.name,
  freezeFrame: (save.shot.freeze_frame ?? []).map((p) => ({
    x: round(p.location[0]),
    y: round(p.location[1]),
    teammate: p.teammate,
    keeper: p.position.name === "Goalkeeper",
  })),
  moves: goalChain(save),
};

// The shootout, kick by kick. end_location is [x, y, z]; y and z place the
// kick in the goal mouth (posts at y 36 and 44, bar at z 2.67).
const kicks = shootout.map((s) => ({
  team: s.team.name,
  player: nameOf(s.player),
  scored: isGoal(s),
  outcome: s.shot.outcome.name,
  y: round(s.shot.end_location[1], 2),
  z: round(s.shot.end_location[2] ?? 0, 2),
}));

// Momentum, Argentina above the line.
const ON_BALL = new Set([
  "Pass",
  "Carry",
  "Shot",
  "Dribble",
  "Ball Receipt*",
  "Duel",
  "Interception",
  "Ball Recovery",
  "Clearance",
  "Miscontrol",
  "Dispossessed",
]);
const periods = [];
for (let period = 1; period <= 4; period++) {
  const inPeriod = events.filter((e) => e.period === period);
  const counts = new Map();
  for (const e of inPeriod) {
    if (!ON_BALL.has(e.type.name) || e.x === undefined || e.x < 80) continue;
    counts.set(e.minute, (counts.get(e.minute) ?? 0) + (e.team.name === HOME ? 1 : -1));
  }
  const first = Math.min(...inPeriod.map((e) => e.minute));
  const last = Math.max(...inPeriod.map((e) => e.minute));
  const raw = Array.from({ length: last - first + 1 }, (_, i) => counts.get(first + i) ?? 0);
  periods.push(
    raw.map((_, i) => {
      const w = raw.slice(Math.max(0, i - 1), i + 2);
      return {
        minute: first + i,
        period,
        value: round(w.reduce((a, b) => a + b, 0) / w.length, 1),
      };
    }),
  );
}
const momentumEvents = goals.map((g) => ({
  minute: round(g.clock / 60, 2),
  period: g.period,
  side: g.team === HOME ? "home" : "away",
  kind: "goal",
  label: `Goal, ${g.scorer}`,
}));

const xg = (team) =>
  round(
    inPlay.filter((s) => s.team.name === team).reduce((a, s) => a + s.shot.statsbomb_xg, 0),
    2,
  );
const firstFranceShot = shotRows.find((s) => s.team === AWAY) ?? fail("France never shot");

const data = {
  matchId: MATCH,
  home: HOME,
  away: AWAY,
  stats: {
    xg: { [HOME]: xg(HOME), [AWAY]: xg(AWAY) },
    shots: {
      [HOME]: shotRows.filter((s) => s.team === HOME).length,
      [AWAY]: shotRows.filter((s) => s.team === AWAY).length,
    },
    firstFranceShot: { clock: firstFranceShot.clock, player: firstFranceShot.player },
    argentinaShotsBefore: shotRows.filter((s) => s.team === HOME && s.clock < firstFranceShot.clock)
      .length,
    mbappeGap: goals[3].clock - goals[2].clock,
    // Seconds between the shot Messi followed up and his goal.
    messiRebound:
      goals[4].clock -
      Math.max(...shotRows.filter((s) => s.clock < goals[4].clock).map((s) => s.clock)),
  },
  shots: shotRows,
  goals,
  theSave,
  kicks,
  momentum: { data: periods.flat(), events: momentumEvents },
};
writeFileSync(join(OUT, "wc-final.json"), JSON.stringify(data));
console.log(JSON.stringify(data.stats, null, 1));
console.log(
  goals.map((g) => `${g.clock} ${g.scorer} ${g.moves.map((m) => m.player).join(">")}`).join("\n"),
);
console.log(kicks.map((k) => `${k.team} ${k.player} ${k.outcome} y=${k.y} z=${k.z}`).join("\n"));
console.log(
  `save: ${theSave.player} xg ${theSave.xg} ${theSave.outcome}, ${theSave.freezeFrame.length} in frame, keeper ${theSave.keeper}`,
);
console.log(`wrote wc-final.json (${(JSON.stringify(data).length / 1024).toFixed(0)} KB)`);
