/**
 * The 2022 final through StatsBomb 360: at each moment, every player the
 * broadcast camera could see, the space each of them controls (a Voronoi
 * cell in their team's colour) and the ball. The cells are clipped to the
 * camera's visible area, so the coloured patch sweeps around the pitch with
 * the play while the rest stays dark.
 *
 * 360 players are anonymous, so between two frames a few seconds apart the
 * dots are paired up by nearest neighbour within each team and slid across;
 * frames further apart cut.
 */
import type { CSSProperties } from "react";
import { Pitch, Scatter, usePitch, Voronoi } from "@pitchkit/react";
import { PitchStage } from "../../components/Chrome";
import { wc360 } from "../../data";
import { appearance, PAD } from "../../theme";
import { uOf } from "./timeline";

export const ARG = "#8ecdf7";
export const FRA = "#3557ee";

interface Player {
  x: number;
  y: number;
  argentina: boolean;
  actor: boolean;
  keeper: boolean;
  opacity: number;
}

const FRAMES = wc360
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

/** Where the camera looked over the last few frames: a fading wash that shows where play has been. */
function Trail({ u }: { u: number }) {
  const { transform } = usePitch();
  const recent = FRAMES.filter((f) => f.u <= u && f.u > u - 1.2);
  return (
    <>
      {recent.map((f, i) => (
        <polygon
          key={i}
          points={f.area.map(([x, y]) => transform.toPixel([x, y]).join(",")).join(" ")}
          fill="#ffffff"
          fillOpacity={0.022 * (1 - (u - f.u) / 1.2)}
        />
      ))}
    </>
  );
}

/** The camera's visible area as a clip path, in the pitch's pixel space. */
function VisibleClip({ id, area }: { id: string; area: [number, number][] }) {
  const { transform } = usePitch();
  const points = area.map(([x, y]) => transform.toPixel([x, y]).join(",")).join(" ");
  return (
    <>
      <defs>
        <clipPath id={id}>
          <polygon points={points} />
        </clipPath>
      </defs>
      <polygon
        points={points}
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={2}
        strokeDasharray="10 8"
      />
    </>
  );
}

function ClippedVoronoi({ id, players }: { id: string; players: Player[] }) {
  return (
    <g clipPath={`url(#${id})`}>
      <Voronoi
        data={players.filter((p) => p.opacity > 0.5)}
        x={(p) => p.x}
        y={(p) => p.y}
        fill={(p) => (p.argentina ? ARG : FRA)}
        fillOpacity={0.72}
        stroke="rgba(5,8,16,0.85)"
        strokeWidth={2}
      />
    </g>
  );
}

const NIGHT = {
  "--pitch-surface": "#0b1220",
  "--pitch-stripe": "rgba(255, 255, 255, 0.025)",
  "--pitch-lines": "rgba(255, 255, 255, 0.4)",
  "--pitch-line-width": "2",
} as CSSProperties;

/** Argentina's colour over the whole pitch, once they've won. */
function Win({ amount }: { amount: number }) {
  const { transform } = usePitch();
  if (amount <= 0) return null;
  const [x0, y0] = transform.toPixel([0, 0]);
  const [x1, y1] = transform.toPixel([120, 80]);
  return (
    <rect
      x={Math.min(x0, x1)}
      y={Math.min(y0, y1)}
      width={Math.abs(x1 - x0)}
      height={Math.abs(y1 - y0)}
      fill={ARG}
      fillOpacity={0.6 * amount}
    />
  );
}

export function Pitch360({
  u,
  width,
  flash = 0,
  win = 0,
}: {
  u: number;
  width: number;
  flash?: number;
  /** 0..1: Argentina's colour taking the whole pitch at the end. */
  win?: number;
}) {
  const scene = sceneAt(u);
  const s = width / 1500;
  const height = Math.round(((width - PAD.left - PAD.right) * 80) / 120 + PAD.top + PAD.bottom);
  return (
    <PitchStage style={NIGHT}>
      <Pitch type="statsbomb" width={width} height={height} padding={PAD} appearance={appearance}>
        <Trail u={u} />
        <VisibleClip id="visible-area" area={scene.area} />
        <ClippedVoronoi id="visible-area" players={scene.players} />
        <Scatter
          data={scene.players}
          x={(p) => p.x}
          y={(p) => p.y}
          r={(p) => (p.actor ? 17 : 13) * s}
          fill={(p) => (p.argentina ? ARG : FRA)}
          fillOpacity={(p) => p.opacity}
          stroke={(p) => (p.actor ? "#ffffff" : "rgba(5,8,16,0.9)")}
          strokeWidth={(p) => (p.actor ? 4 : 2) * s}
        />
        <Win amount={win} />
        <Scatter
          data={[scene.ball]}
          x={(b) => b.x}
          y={(b) => b.y}
          r={(9 + 10 * flash) * s}
          fill="#fde047"
          stroke="#000000"
          strokeWidth={2 * s}
        />
      </Pitch>
    </PitchStage>
  );
}
