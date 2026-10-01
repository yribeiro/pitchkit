/**
 * Snapshot for reel 03 ("11 layers, 1 pitch"): one real finding per layer from
 * the Euro 2024 final (StatsBomb open data, events + 360). Writes
 * src/data/layers-reel.json — the plot data AND every number a stat chip shows,
 * so nothing in the reel is typed by hand.
 *
 *   npm run build --workspace=@pitchkit/data-providers
 *   npm run snapshot:layers --workspace=social
 *
 * Caveats baked into the claims (and the captions):
 * - 360 only contains players the broadcast camera saw (19 of 22 in the Voronoi
 *   frame), and has no player ids.
 * - StatsBomb coordinates are abstract grid units (120 x 80), not metres.
 * - Each team's events are recorded attacking left-to-right.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computePositionalBins, getPitchDimensions } from "@pitchkit/core";
import {
  carries,
  fetchLineups,
  fetchMatchEvents,
  fetchMatchThreeSixty,
  indexThreeSixtyByEvent,
  isAssist,
  isComplete,
  isGoal,
  isKeyPass,
  passes,
  shots,
} from "@pitchkit/data-providers/statsbomb";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });
const round = (n, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;
const pct = (n, d, dp = 1) => round((n / d) * 100, dp);

const MATCH = 3943043;
const events = await fetchMatchEvents(MATCH);
const frames = indexThreeSixtyByEvent(await fetchMatchThreeSixty(MATCH));
const lineups = await fetchLineups(MATCH);
const nickname = new Map(
  lineups.flatMap((t) => t.lineup.map((p) => [p.player_id, p.player_nickname ?? p.player_name])),
);
const nameOf = (ref) => (ref ? (nickname.get(ref.id) ?? ref.name) : "Unknown");
const surname = (n) => n.split(" ").slice(-1)[0];

const team = (e, t) => e.team.name === t;
const TOUCH = ["Pass", "Carry", "Ball Receipt*", "Dribble", "Shot", "Ball Recovery", "Duel", "Pressure"];

/* 1 · Scatter — every shot, both teams ----------------------------------- */
const allShots = shots(events);
const shotStats = (t) => {
  const s = allShots.filter((x) => team(x, t));
  return { n: s.length, xg: round(s.reduce((a, b) => a + b.shot.statsbomb_xg, 0), 2) };
};

/* 2 · Arrows — Spain's key passes ---------------------------------------- */
const spainPasses = passes(events).filter((p) => team(p, "Spain"));
const keyPasses = spainPasses.filter((p) => isKeyPass(p) || isAssist(p));
const keyArrows = keyPasses.map((p) => ({
  x: round(p.x),
  y: round(p.y),
  endX: round(p.endX),
  endY: round(p.endY),
  assist: isAssist(p),
  player: surname(nameOf(p.player)),
  minute: p.minute + 1,
}));

/* 3 · Comet — carries that gain 15+ units -------------------------------- */
const fwdCarries = (t) => carries(events).filter((c) => team(c, t) && c.endX - c.x >= 15);
const spainCarries = fwdCarries("Spain").map((c) => ({
  x: round(c.x),
  y: round(c.y),
  endX: round(c.endX),
  endY: round(c.endY),
}));

/* 4 · Heatmap — Spain's tracked player positions (360, in possession) ---- */
const positions = [];
let positionFrames = 0;
for (const e of events) {
  if (!team(e, "Spain")) continue;
  const f = frames.get(e.id);
  if (!f) continue;
  positionFrames++;
  for (const p of f.freeze_frame) if (p.teammate && !p.keeper) positions.push([round(p.x), round(p.y)]);
}
const sortedX = positions.map((p) => p[0]).sort((a, b) => a - b);

/* 5 · Hexbin — pressures -------------------------------------------------- */
const pressures = (t) => events.filter((e) => e.type.name === "Pressure" && team(e, t) && e.x != null);
const sp = pressures("Spain");
const en = pressures("England");
const finalThird = (list) => list.filter((e) => e.x >= 80).length;

/* 6 · KDE — the two wingers' touches -------------------------------------- */
const idOf = (needle) => {
  const hit = [...nickname.entries()].find(([, n]) => n.includes(needle));
  if (!hit) throw new Error(`No player matching ${needle}`);
  return hit[0];
};
const touchesOf = (id) =>
  events.filter((e) => e.player?.id === id && e.x != null && TOUCH.includes(e.type.name));
const yamal = touchesOf(idOf("Yamal"));
const williams = touchesOf(idOf("Williams"));
const pts = (list) => list.map((e) => ({ x: round(e.x), y: round(e.y) }));

/* 7 · PositionalHeatmap — where completed passes landed, by zone ---------- */
const dims = getPitchDimensions("statsbomb");
const topZone = (t) => {
  const done = passes(events).filter((p) => team(p, t) && isComplete(p));
  const bins = computePositionalBins(
    { type: "positionalHeatmap", data: done, x: (p) => p.endX, y: (p) => p.endY },
    dims,
  );
  const top = bins.slice().sort((a, b) => b.value - a.value)[0];
  return { name: top.name, x: round(top.x), y: round(top.y), pct: pct(top.value, done.length, 0) };
};

/* 8 · Flow — how direct each team's completed passes were ----------------- */
const completed = (t) => passes(events).filter((p) => team(p, t) && isComplete(p));
const direct = (t) => {
  const c = completed(t);
  return pct(c.filter((p) => p.endX - p.x >= 15).length, c.length, 0);
};
const flowPass = (p) => ({ x: round(p.x), y: round(p.y), endX: round(p.endX), endY: round(p.endY) });

/* 9 · Voronoi — the space seconds before Williams' goal ---------------- */
// Palmer's shot freeze frame only holds 14 players, so its cells are huge and
// uneven. The 360 frame for Carvajal's pass in the move for Williams' goal has 19 of the
// 22 players tracked — enough for a Voronoi that reads as a real partition.
const spainGoal = allShots.filter(isGoal).find((g) => g.player.name.includes("Williams"));
const lead = events
  .filter((e) => e.possession === spainGoal.possession && e.index <= spainGoal.index && frames.has(e.id))
  .map((e) => ({ e, n: frames.get(e.id).freeze_frame.length }))
  .sort((a, b) => b.n - a.n || b.e.index - a.e.index)[0];
const vFrame = frames.get(lead.e.id);
const vSites = vFrame.freeze_frame.map((p) => ({
  x: round(p.x),
  y: round(p.y),
  // `teammate` is relative to the acting team, which is Spain here.
  spain: p.teammate,
  actor: p.actor,
  keeper: p.keeper,
}));
const vCells = new Array(vSites.length).fill(0);
for (let x = 0.5; x < 120; x += 1) {
  for (let y = 0.5; y < 80; y += 1) {
    let best = 0;
    let bestD = Infinity;
    vSites.forEach((s, i) => {
      const d = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (d < bestD) [bestD, best] = [d, i];
    });
    vCells[best]++;
  }
}
const spainShare = vCells.reduce((a, v, i) => a + (vSites[i].spain ? v : 0), 0);
const voronoi = {
  event: lead.e.type.name,
  player: surname(nameOf(lead.e.player)),
  clock: `${lead.e.minute}:${String(lead.e.second).padStart(2, "0")}`,
  secondsBefore: spainGoal.minute * 60 + spainGoal.second - (lead.e.minute * 60 + lead.e.second),
  players: vSites.length,
  spainSharePct: pct(spainShare, 120 * 80, 0),
  englandSharePct: 100 - pct(spainShare, 120 * 80, 0),
};

/* 10 · ConvexHull — first-half average-position shape --------------------- */
const hullOf = (points) => {
  const p = points.map((q) => [q.x, q.y]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop();
    lo.push(q);
  }
  const up = [];
  for (const q of [...p].reverse()) {
    while (up.length >= 2 && cr(up.at(-2), up.at(-1), q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const polyArea = (h) =>
  Math.abs(h.reduce((a, [x1, y1], i) => a + x1 * h[(i + 1) % h.length][1] - h[(i + 1) % h.length][0] * y1, 0)) / 2;
const shapeOf = (t) => {
  const xi = events
    .find((e) => e.type.name === "Starting XI" && team(e, t))
    .tactics.lineup.filter((p) => p.position.name !== "Goalkeeper");
  const half = events.filter((e) => team(e, t) && e.period === 1 && e.player && e.x != null && TOUCH.includes(e.type.name));
  const players = [];
  for (const entry of xi) {
    const mine = half.filter((e) => e.player.id === entry.player.id);
    if (mine.length < 8) continue; // too few touches for a stable average
    players.push({
      label: nameOf(entry.player),
      x: round(mine.reduce((a, e) => a + e.x, 0) / mine.length),
      y: round(mine.reduce((a, e) => a + e.y, 0) / mine.length),
    });
  }
  return {
    players,
    meanX: round(players.reduce((a, p) => a + p.x, 0) / players.length),
    hullArea: Math.round(polyArea(hullOf(players))),
  };
};
const shapeSpain = shapeOf("Spain");
const shapeEngland = shapeOf("England");

/* 11 · GoalAngle — the angle each goal was scored from -------------------- */
// Posts at y=36 and y=44 on the x=120 goal line.
const angle = (x, y) =>
  Math.round((Math.abs(Math.atan2(44 - y, 120 - x) - Math.atan2(36 - y, 120 - x)) * 180) / Math.PI);
const goalAngles = allShots.filter(isGoal).map((g) => ({
  player: surname(nameOf(g.player)),
  team: g.team.name,
  minute: g.minute + 1,
  x: round(g.x),
  y: round(g.y),
  angle: angle(g.x, g.y),
  xg: round(g.shot.statsbomb_xg, 2),
}));

const data = {
  stats: {
    shots: { spain: shotStats("Spain"), england: shotStats("England") },
    keyPasses: {
      spain: spainPasses.filter(isKeyPass).length,
      england: passes(events).filter((p) => team(p, "England") && isKeyPass(p)).length,
      spainAssists: spainPasses.filter(isAssist).length,
    },
    carries: { spain: spainCarries.length, england: fwdCarries("England").length },
    positions: {
      n: positions.length,
      frames: positionFrames,
      pctFinalThird: pct(positions.filter((p) => p[0] >= 80).length, positions.length, 0),
      medianX: sortedX[sortedX.length >> 1],
    },
    pressures: {
      spain: sp.length,
      england: en.length,
      spainFinalThird: finalThird(sp),
      englandFinalThird: finalThird(en),
    },
    touches: {
      yamal: yamal.length,
      williams: williams.length,
      yamalPctAttHalf: pct(yamal.filter((e) => e.x >= 60).length, yamal.length, 0),
    },
    zone: { spain: topZone("Spain"), england: topZone("England") },
    direct: { spain: direct("Spain"), england: direct("England") },
    voronoi,
    shape: {
      spainMeanX: shapeSpain.meanX,
      englandMeanX: shapeEngland.meanX,
      diff: round(shapeSpain.meanX - shapeEngland.meanX, 0),
      spainArea: shapeSpain.hullArea,
      englandArea: shapeEngland.hullArea,
    },
    goalAngles,
  },
  keyArrows,
  carries: spainCarries,
  positions,
  pressures: sp.map((e) => ({ x: round(e.x), y: round(e.y) })),
  yamal: pts(yamal),
  williams: pts(williams),
  englandFlow: completed("England").map(flowPass),
  voronoiSites: vSites,
  shape: { spain: shapeSpain.players, england: shapeEngland.players },
};

writeFileSync(join(OUT, "layers-reel.json"), JSON.stringify(data));
console.log(JSON.stringify(data.stats, null, 1));
console.log(`wrote layers-reel.json (${(JSON.stringify(data).length / 1024).toFixed(0)} KB)`);
