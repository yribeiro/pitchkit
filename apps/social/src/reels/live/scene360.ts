/**
 * StatsBomb 360 frames from the 2022 final as scenes: at minutes played `u`,
 * every player the broadcast camera could see, the ball and the camera's
 * visible area.
 *
 * 360 players are anonymous, so between two frames a few seconds apart they
 * are paired up by nearest team-mate and slid across; frames further apart
 * cut. Only the actor and the keepers can be named, so only they carry a
 * shirt number.
 */
import { wc360 } from "../../data";
import { uOf } from "./timeline";

export const ARG = "#8ecdf7";
export const FRA = "#3557ee";

export interface Player {
  x: number;
  y: number;
  argentina: boolean;
  actor: boolean;
  keeper: boolean;
  /** Shirt number, where the data can name the player: the actor and the keepers. */
  number: number | null;
  opacity: number;
}

export const FRAMES = wc360.frames
  .map((f) => {
    const players: Player[] = [];
    for (let i = 0; i + 2 < f.f.length; i += 3) {
      const flags = f.f[i + 2]!;
      players.push({
        x: f.f[i]! / 2,
        y: f.f[i + 1]! / 2,
        argentina: (flags & 1) === 1,
        actor: (flags & 2) === 2,
        keeper: (flags & 4) === 4,
        number:
          (flags & 2) === 2
            ? f.n
            : (flags & 4) === 4
              ? (flags & 1) === 1
                ? wc360.keepers.argentina
                : wc360.keepers.france
              : null,
        opacity: 1,
      });
    }
    const area: [number, number][] = [];
    for (let i = 0; i + 1 < f.a.length; i += 2) area.push([f.a[i]! / 2, f.a[i + 1]! / 2]);
    return { u: uOf(f.p, f.m), ball: { x: f.b[0]! / 2, y: f.b[1]! / 2 }, area, players };
  })
  .sort((a, b) => a.u - b.u);

/** Slides each player in `a` to their nearest unclaimed team-mate in `b`. */
function tween(a: Player[], b: Player[], t: number): Player[] {
  const out: Player[] = [];
  for (const team of [true, false]) {
    const from = a.filter((p) => p.argentina === team);
    const to = b.filter((p) => p.argentina === team);
    const pairs: [number, number, number][] = [];
    from.forEach((p, i) =>
      to.forEach((q, j) => pairs.push([Math.hypot(p.x - q.x, p.y - q.y), i, j])),
    );
    pairs.sort((x, y) => x[0] - y[0]);
    const usedA = new Set<number>();
    const usedB = new Set<number>();
    for (const [d, i, j] of pairs) {
      if (usedA.has(i) || usedB.has(j) || d > 25) continue;
      usedA.add(i);
      usedB.add(j);
      const p = from[i]!;
      const q = to[j]!;
      out.push({
        ...q,
        x: p.x + (q.x - p.x) * t,
        y: p.y + (q.y - p.y) * t,
        actor: t < 0.5 ? p.actor : q.actor,
        number: t < 0.5 ? p.number : q.number,
      });
    }
    from.forEach((p, i) => !usedA.has(i) && out.push({ ...p, opacity: 1 - t }));
    to.forEach((q, j) => !usedB.has(j) && out.push({ ...q, opacity: t }));
  }
  return out;
}

/** What the 360 data shows at minutes played `u`. */
export function sceneAt(u: number) {
  let i = FRAMES.findIndex((f) => f.u > u) - 1;
  if (i < -1) i = FRAMES.length - 1;
  if (i < 0) return { ...FRAMES[0]!, live: FRAMES[0]! };
  const a = FRAMES[i]!;
  const b = FRAMES[i + 1];
  if (!b) return { ...a, live: a };
  const gap = (b.u - a.u) * 60;
  const t = (u - a.u) / (b.u - a.u);
  // A few seconds apart: slide. Further: hold, then cut.
  if (gap > 8) return { ...(t < 0.85 ? a : b), live: t < 0.85 ? a : b };
  const s = t * t * (3 - 2 * t);
  return {
    u,
    area: s < 0.5 ? a.area : b.area,
    ball: { x: a.ball.x + (b.ball.x - a.ball.x) * s, y: a.ball.y + (b.ball.y - a.ball.y) * s },
    players: tween(a.players, b.players, s),
    live: s < 0.5 ? a : b,
  };
}
