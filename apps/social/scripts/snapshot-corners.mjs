/**
 * Snapshot for the corner-kick carousel: the corners Auckland FC took against
 * Newcastle Jets (SkillCorner open data, match 1886347), with every tracked
 * player's path from just before the kick to four seconds after it.
 *
 *   npm run snapshot:corners --workspace=social
 *
 * A corner is a phase whose `game_interruption_before` is `corner_for` and
 * whose first possession starts at the flag. Positions are centre-origin
 * metres (what `<Pitch type="skillcorner">` plots), flipped so the corner-taking team always attacks left to right.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  attackingSideOf,
  fetchDynamicEvents,
  fetchMatch,
  parseTracking,
  trackingUrl,
} from "@pitchkit/data-providers/skillcorner";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });
const r1 = (n) => Math.round(n * 10) / 10;

const match = await fetchMatch(1886347);
const L = match.pitch_length;
const W = match.pitch_width;
const dynamic = await fetchDynamicEvents(match);
const teamOf = new Map(match.players.map((p) => [p.id, p.team_id]));
const who = new Map(match.players.map((p) => [p.id, p]));

// First possession of each corner phase, kept only when it starts at the flag.
const first = new Map();
for (const e of dynamic) {
  if (e.event_type !== "player_possession") continue;
  if (!String(e.game_interruption_before ?? "").startsWith("corner_for")) continue;
  if (!first.has(e.phase_index)) first.set(e.phase_index, e);
}
const atFlag = [...first.values()].filter(
  (e) => Math.abs(e.x_start) > L / 2 - 8 && Math.abs(e.y_start) > W / 2 - 12,
);

const url = trackingUrl(match.id);
/** Byte-range read; `fetchTrackingWindow`'s fixed bytes/frame drifts late in a match. */
async function window(from, to) {
  const frameAt = async (o) => {
    const res = await fetch(url, { headers: { Range: `bytes=${o}-${o + 6000}` } });
    return JSON.parse((await res.text()).split("\n")[1]).frame;
  };
  let offset = from * 1500;
  for (let i = 0; i < 10; i++) {
    const gap = from - (await frameAt(offset));
    if (gap >= 20 && gap < 200) break;
    offset = Math.max(0, offset + (gap - 60) * 1500);
  }
  const res = await fetch(url, {
    headers: { Range: `bytes=${offset}-${offset + (to - from + 250) * 2600}` },
  });
  const lines = (await res.text()).split("\n").slice(1, -1).join("\n");
  return parseTracking(lines, match).filter((f) => f.frame >= from && f.frame <= to);
}

const corners = [];
for (const e of atFlag) {
  const kick = e.frame_start;
  const dir = attackingSideOf(match, e.team_id, e.period) === "right_to_left" ? -1 : 1;
  const frames = await window(kick - 10, kick + 40);
  if (frames.length < 40) throw new Error(`Only ${frames.length} frames for corner at ${kick}`);
  const proj = (x, y) => [r1(x * dir), r1(y * dir)];
  corners.push({
    minute: e.minute_start,
    period: e.period,
    team: e.team_shortname,
    taker: e.player_name,
    kick,
    ledToShot: e.lead_to_shot === true,
    frames: frames.map((f) => ({
      frame: f.frame - kick,
      ball: f.ball_data.x === null ? null : proj(f.ball_data.x, f.ball_data.y),
      players: f.player_data.map((p) => [
        p.player_id,
        ...proj(p.x, p.y),
        teamOf.get(p.player_id) === e.team_id ? 1 : 0,
        p.is_detected ? 1 : 0,
      ]),
    })),
  });
}

const ids = new Set(corners.flatMap((c) => c.frames.flatMap((f) => f.players.map((p) => p[0]))));
writeFileSync(
  join(OUT, "corners.json"),
  JSON.stringify({
    matchId: match.id,
    home: match.home_team.short_name,
    away: match.away_team.short_name,
    pitchLength: L,
    pitchWidth: W,
    players: Object.fromEntries(
      [...ids].map((id) => [
        id,
        { name: who.get(id)?.short_name ?? "?", number: who.get(id)?.number ?? null },
      ]),
    ),
    corners,
  }),
);
console.log(`wrote corners.json: ${corners.length} corners`);
