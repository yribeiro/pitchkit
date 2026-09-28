/**
 * Snapshot the real match data the social posts are drawn from.
 *
 * Remotion renders frame-by-frame in headless Chrome, so a live fetch per
 * render is slow and non-deterministic. This pulls everything once through
 * `@pitchkit/data-providers` (the same calls the docs examples make in the
 * browser), trims it to the fields the compositions read, and writes small
 * JSON files into `src/data/` that are committed alongside the source.
 *
 *   npm run build --workspace=@pitchkit/data-providers
 *   npm run snapshot --workspace=social
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  carries,
  fetchLineups,
  fetchMatchEvents,
  isCarry,
  isComplete,
  isGoal,
  isPass,
  passes,
  shots,
} from "@pitchkit/data-providers/statsbomb";
import {
  fetchDynamicEvents,
  fetchMatch,
  parseTracking,
  trackingUrl,
} from "@pitchkit/data-providers/skillcorner";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });

const round = (n, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;
const write = (name, value) => {
  const path = join(OUT, name);
  writeFileSync(path, JSON.stringify(value));
  console.log(`wrote ${name} (${(JSON.stringify(value).length / 1024).toFixed(1)} KB)`);
};

/* ------------------------------------------------------------------------ */
/* StatsBomb — Euro 2024 final, Spain 2–1 England, Berlin, 14 July 2024.     */
/* ------------------------------------------------------------------------ */

const EURO_2024_FINAL = 3943043;
const events = await fetchMatchEvents(EURO_2024_FINAL);
write("final-meta.json", { matchId: EURO_2024_FINAL, eventCount: events.length });

// StatsBomb names are full legal names ("Rodrigo Hernández Cascante"); the
// lineup file's nickname is what the player is actually called ("Rodri").
const lineups = await fetchLineups(EURO_2024_FINAL);
const nickname = new Map(
  lineups.flatMap((team) =>
    team.lineup.map((p) => [p.player_id, p.player_nickname ?? p.player_name]),
  ),
);
const nameOf = (ref) => (ref ? (nickname.get(ref.id) ?? ref.name) : "Unknown");

// Every shot, both teams.
const allShots = shots(events).map((s) => ({
  team: s.team.name,
  player: nameOf(s.player),
  minute: s.minute,
  x: round(s.x),
  y: round(s.y),
  endX: round(s.endX),
  endY: round(s.endY),
  xg: round(s.shot.statsbomb_xg, 3),
  outcome: s.shot.outcome.name,
  goal: isGoal(s),
}));
write("final-shots.json", allShots);

// The possession behind each goal, truncated at the goal and filtered to the
// team that owned it (see apps/docs/components/examples/quickstart-chain-basic.tsx).
function goalChain(goal) {
  const possession = events.filter((e) => e.possession === goal.possession);
  const upToGoal = possession.slice(0, possession.indexOf(goal) + 1);
  const attacking = upToGoal.filter((e) => e.team.id === e.possession_team.id);
  const moves = attacking
    .filter((e) => isPass(e) || (isCarry(e) && Math.hypot(e.endX - e.x, e.endY - e.y) > 2))
    .map((e) => ({
      kind: isPass(e) ? "pass" : "carry",
      player: nameOf(e.player),
      x: round(e.x),
      y: round(e.y),
      endX: round(e.endX),
      endY: round(e.endY),
      second: e.minute * 60 + e.second,
    }));
  return {
    team: goal.team.name,
    scorer: nameOf(goal.player),
    minute: goal.minute,
    xg: round(goal.shot.statsbomb_xg, 3),
    goal: {
      x: round(goal.x),
      y: round(goal.y),
      endX: round(goal.endX),
      endY: round(goal.endY),
      second: goal.minute * 60 + goal.second,
    },
    moves,
    // The shot's own freeze frame: every player StatsBomb placed at the
    // moment of the strike, with names.
    freezeFrame: (goal.shot.freeze_frame ?? []).map((p) => ({
      x: round(p.location[0]),
      y: round(p.location[1]),
      teammate: p.teammate,
      player: nameOf(p.player),
      position: p.position.name,
    })),
  };
}
const goals = shots(events).filter(isGoal);
write(
  "final-goals.json",
  goals.map((g) => goalChain(g)),
);

// Spain's pass network, starting XI up to the first substitution.
const SPAIN = "Spain";
const firstSub = events.find((e) => e.type.name === "Substitution" && e.team.name === SPAIN);
const cutoff = firstSub ? firstSub.index : Infinity;
const spainPasses = passes(events).filter((p) => p.team.name === SPAIN && p.index < cutoff);
const completed = spainPasses.filter(isComplete).filter((p) => p.pass.recipient);

const lineup = events.find((e) => e.type.name === "Starting XI" && e.team.name === SPAIN);
const nodes = new Map();
for (const entry of lineup.tactics.lineup) {
  nodes.set(entry.player.id, {
    id: entry.player.id,
    name: entry.player.name,
    label: nameOf(entry.player),
    jersey: entry.jersey_number,
    position: entry.position.name,
    sx: 0,
    sy: 0,
    n: 0,
  });
}
for (const p of spainPasses) {
  const node = nodes.get(p.player?.id);
  if (!node) continue;
  node.sx += p.x;
  node.sy += p.y;
  node.n += 1;
}
for (const p of completed) {
  const node = nodes.get(p.pass.recipient.id);
  if (!node) continue;
  node.sx += p.endX;
  node.sy += p.endY;
  node.n += 1;
}
const edges = new Map();
for (const p of completed) {
  const a = p.player?.id;
  const b = p.pass.recipient.id;
  if (!nodes.has(a) || !nodes.has(b)) continue;
  const key = a < b ? `${a}-${b}` : `${b}-${a}`;
  edges.set(key, {
    from: Math.min(a, b),
    to: Math.max(a, b),
    count: (edges.get(key)?.count ?? 0) + 1,
  });
}
write("spain-pass-network.json", {
  minutes: firstSub ? firstSub.minute : 90,
  nodes: [...nodes.values()].map(({ sx, sy, n, ...rest }) => ({
    ...rest,
    x: round(sx / n),
    y: round(sy / n),
    touches: n,
  })),
  edges: [...edges.values()].filter((e) => e.count >= 3),
});

// Every Spain pass origin and completed-pass flag — density layers, pass maps.
write(
  "spain-passes.json",
  passes(events)
    .filter((p) => p.team.name === SPAIN)
    .map((p) => ({
      x: round(p.x),
      y: round(p.y),
      endX: round(p.endX),
      endY: round(p.endY),
      complete: isComplete(p),
      player: nameOf(p.player),
    })),
);

// Every Spain carry — for a Comet layer.
write(
  "spain-carries.json",
  carries(events)
    .filter((c) => c.team.name === SPAIN && Math.hypot(c.endX - c.x, c.endY - c.y) > 5)
    .map((c) => ({ x: round(c.x), y: round(c.y), endX: round(c.endX), endY: round(c.endY) })),
);

// Lamine Yamal's touches — a single-player KDE.
write(
  "yamal-touches.json",
  events
    .filter(
      (e) =>
        e.player?.name?.includes("Yamal") &&
        e.x !== undefined &&
        ["Pass", "Carry", "Ball Receipt*", "Dribble", "Shot"].includes(e.type.name),
    )
    .map((e) => ({ x: round(e.x), y: round(e.y) })),
);

/* ------------------------------------------------------------------------ */
/* SkillCorner — broadcast tracking of the build-up to a goal.              */
/* ------------------------------------------------------------------------ */

const SKILLCORNER_MATCH = 1886347; // Auckland FC 2–0 Newcastle Jets, 30 Nov 2024
const match = await fetchMatch(SKILLCORNER_MATCH);
const dynamic = await fetchDynamicEvents(match);

// `lead_to_goal` is stamped on every possession in the move; the last one is
// the shooter's.
const goalMove = dynamic.filter(
  (e) => e.event_type === "player_possession" && e.lead_to_goal === true,
);
const goalPossession = goalMove.at(-1);
if (!goalPossession) throw new Error(`No goal-leading possession in SkillCorner match ${match.id}`);
const shotFrame = goalPossession.frame_end ?? goalPossession.frame_start;

/**
 * A byte-range read of the frames we want. `fetchTrackingWindow` estimates
 * the offset at a fixed 1,400 bytes/frame, which drifts by megabytes late in
 * a match (this file averages ~1,575), so this probes the file to find the
 * real offset first, then reads just the window.
 */
async function trackingWindow(fromFrame, toFrame) {
  const url = trackingUrl(match.id);
  const frameAt = async (offset) => {
    const res = await fetch(url, { headers: { Range: `bytes=${offset}-${offset + 6000}` } });
    const line = (await res.text()).split("\n")[1];
    return JSON.parse(line).frame;
  };
  let offset = fromFrame * 1500;
  for (let i = 0; i < 8; i++) {
    const at = await frameAt(offset);
    const gap = fromFrame - at;
    if (gap >= 20 && gap < 200) break;
    offset = Math.max(0, offset + (gap - 60) * 1500);
  }
  const res = await fetch(url, {
    headers: { Range: `bytes=${offset}-${offset + (toFrame - fromFrame + 250) * 2200}` },
  });
  const lines = (await res.text()).split("\n").slice(1, -1).join("\n");
  return parseTracking(lines, match).filter((f) => f.frame >= fromFrame && f.frame <= toFrame);
}

// ~17 seconds of build-up and 2 seconds after the shot, at 10 fps.
const frames = await trackingWindow(goalMove[0].frame_start - 60, shotFrame + 20);
if (frames.length < 100) throw new Error(`Only got ${frames.length} tracking frames`);
const isHome = new Map(match.players.map((p) => [p.id, p.team_id === match.home_team.id]));
const shooter = match.players.find((p) => p.id === goalPossession.player_id);
const scoringTeamIsHome = goalPossession.team_id === match.home_team.id;

write("skillcorner-goal.json", {
  matchId: match.id,
  home: match.home_team.short_name ?? match.home_team.name,
  away: match.away_team.short_name ?? match.away_team.name,
  homeScore: match.home_team_score,
  awayScore: match.away_team_score,
  date: match.date_time,
  pitchLength: match.pitch_length,
  pitchWidth: match.pitch_width,
  scorer: shooter?.short_name ?? "Unknown",
  scoringTeamIsHome,
  shotFrame,
  period: goalPossession.period,
  frames: frames
    .filter((f) => f.player_data.length > 0)
    .map((f) => ({
      frame: f.frame,
      ball: f.ball_data.x === null ? null : [round(f.ball_data.x, 2), round(f.ball_data.y, 2)],
      players: f.player_data.map((p) => [
        round(p.x, 2),
        round(p.y, 2),
        isHome.get(p.player_id) ? 1 : 0,
        p.is_detected ? 1 : 0,
      ]),
    })),
});
