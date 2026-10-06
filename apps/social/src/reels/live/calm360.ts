/**
 * Calmer 360: instead of showing each frame as it comes, stitch anonymous 360
 * players into tracks and show each track's recent average position.
 *
 * Tracks: walking the frames in order, each player is matched to the nearest
 * live track of their own team (one seen in the last 30 seconds of play,
 * within 15 units); anyone unmatched starts a new track. It's a heuristic, not
 * identity, but averaging over a few minutes smooths out its mistakes.
 *
 * Averages: every sighting is weighted by how recent it is (exponential decay
 * over about a minute of play) and fades in as the clock passes it, so the
 * positions and the Voronoi built on them move continuously.
 */
import { FRAMES } from "./scene360";

interface Sighting {
  u: number;
  x: number;
  y: number;
}
interface Track {
  argentina: boolean;
  keeper: boolean;
  seen: Sighting[];
}

const LIVE_FOR = 0.5;
const MATCH_WITHIN = 15;

const TRACKS: Track[] = (() => {
  const tracks: Track[] = [];
  for (const frame of FRAMES) {
    for (const team of [true, false]) {
      const players = frame.players.filter((p) => p.argentina === team);
      const live = tracks.filter(
        (t) =>
          t.argentina === team &&
          frame.u - t.seen.at(-1)!.u <= LIVE_FOR &&
          t.seen.at(-1)!.u < frame.u,
      );
      const pairs: [number, number, number][] = [];
      players.forEach((p, i) =>
        live.forEach((t, j) => {
          const last = t.seen.at(-1)!;
          pairs.push([Math.hypot(p.x - last.x, p.y - last.y), i, j]);
        }),
      );
      pairs.sort((a, b) => a[0] - b[0]);
      const usedP = new Set<number>();
      const usedT = new Set<number>();
      for (const [d, i, j] of pairs) {
        if (usedP.has(i) || usedT.has(j) || d > MATCH_WITHIN) continue;
        usedP.add(i);
        usedT.add(j);
        const p = players[i]!;
        live[j]!.seen.push({ u: frame.u, x: p.x, y: p.y });
        live[j]!.keeper ||= p.keeper;
      }
      players.forEach((p, i) => {
        if (!usedP.has(i)) {
          tracks.push({
            argentina: team,
            keeper: p.keeper,
            seen: [{ u: frame.u, x: p.x, y: p.y }],
          });
        }
      });
    }
  }
  return tracks;
})();

/** Recent-weighted average over sightings up to `u`. */
function weigh(seen: { u: number }[], u: number, tau: number, fadeIn: number, window: number) {
  return seen.map((s) => {
    const age = u - s.u;
    if (age < 0 || age > window) return 0;
    const ramp = Math.min(age / fadeIn, 1);
    return Math.exp(-age / tau) * ramp * ramp * (3 - 2 * ramp);
  });
}

export interface AveragedPlayer {
  x: number;
  y: number;
  argentina: boolean;
  keeper: boolean;
  /** 0..1: how much recent evidence there is for this player. */
  confidence: number;
}

/** Every track's recent average position at minutes played `u`. */
export function averagedAt(u: number): AveragedPlayer[] {
  const out: AveragedPlayer[] = [];
  for (const t of TRACKS) {
    if (t.seen[0]!.u > u || u - t.seen.at(-1)!.u > 3) continue;
    const w = weigh(t.seen, u, 1, 0.35, 3);
    const total = w.reduce((a, b) => a + b, 0);
    if (total < 0.02) continue;
    let x = 0;
    let y = 0;
    t.seen.forEach((s, i) => {
      x += s.x * w[i]!;
      y += s.y * w[i]!;
    });
    out.push({
      x: x / total,
      y: y / total,
      argentina: t.argentina,
      keeper: t.keeper,
      confidence: Math.min(total / 0.7, 1),
    });
  }
  // A team has eleven players; tracking splits some into fragments, so keep
  // each side's eleven best-supported tracks.
  return [true, false].flatMap((team) =>
    out
      .filter((p) => p.argentina === team)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 11),
  );
}

/** The ball, smoothed over the last half-minute of play. */
export function ballAt(u: number) {
  const recent = FRAMES.filter((f) => f.u <= u && f.u > u - 1);
  const w = weigh(recent, u, 0.25, 0.2, 1);
  const total = w.reduce((a, b) => a + b, 0);
  if (total < 1e-3) return null;
  return {
    x: recent.reduce((sum, f, i) => sum + f.ball.x * w[i]!, 0) / total,
    y: recent.reduce((sum, f, i) => sum + f.ball.y * w[i]!, 0) / total,
  };
}

/** The 360 frame nearest minutes played `u` (for penalties, which have no shot freeze frame). */
export function frameNear(u: number) {
  let best = FRAMES[0]!;
  for (const f of FRAMES) if (Math.abs(f.u - u) < Math.abs(best.u - u)) best = f;
  return best;
}
