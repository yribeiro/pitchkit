/**
 * The network cut's pitch: every player as a numbered disc drifting to their
 * recent average position (the pass-network idea, without the lines), on a
 * pitch tilted so all of it stays in frame.
 *
 * Positions come from the event data (passes, receptions, carries, shots…),
 * so every disc is a named player and substitutes appear when they first
 * touch the ball. Each position is a recent-weighted average of the player's
 * touches, anchored lightly to their average for the match, so it moves
 * continuously. The ball slides from touch to touch.
 *
 * At each goal (and Kolo Muani's late chance) the camera swoops along a
 * bezier arc into the attacking half, turned so the goal sits at an angle at
 * the top of the frame. The build-up draws in as arrows, the goal angle opens
 * from the shooter to the posts, and the shot flies in as a comet, as in
 * reel 05. During the shootout the goal mouth shows where every kick went,
 * and the champions moment paints Argentina's flag across the pitch.
 */
import { Arrows, Comet, GoalAngle, Pitch, Scatter, usePitch } from "@pitchkit/react";
import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";
import { PitchStage } from "../../components/Chrome";
import { Mark } from "../../components/Logo";
import { wcFinal as F, wcTouches } from "../../data";
import type { FinalMove } from "../../data";
import { appearance, C, FONT, PAD } from "../../theme";
import { ARG, FRA } from "./scene360";
import type { Timeline } from "./timeline";
import { uOf } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = (t: number) => t * t * (3 - 2 * t);

const PW = 1500;
const PH = Math.round(((PW - PAD.left - PAD.right) * 80) / 120 + PAD.top + PAD.bottom);
const K = (PW - PAD.left - PAD.right) / 120;
const S = PW / 1500;

const NIGHT = {
  "--pitch-surface": "#0b1220",
  "--pitch-stripe": "rgba(255, 255, 255, 0.025)",
  "--pitch-lines": "rgba(255, 255, 255, 0.45)",
  "--pitch-line-width": "2",
} as CSSProperties;

/* Players: touches, then recent averages ---------------------------------- */

interface Touch {
  u: number;
  x: number;
  y: number;
}
const PLAYERS = wcTouches.players.map((p) => ({
  argentina: p.team === "A",
  n: p.n,
  touches: [] as Touch[],
}));
const ALL: (Touch & { player: number })[] = [];
for (let i = 0; i + 4 < wcTouches.touches.length; i += 5) {
  const [player, period, minute10, x2, y2] = wcTouches.touches.slice(i, i + 5) as [
    number,
    number,
    number,
    number,
    number,
  ];
  const t = { u: uOf(period, minute10 / 10), x: x2 / 2, y: y2 / 2 };
  PLAYERS[player]!.touches.push(t);
  ALL.push({ ...t, player });
}
ALL.sort((a, b) => a.u - b.u);
const ROSTER = PLAYERS.map((p) => {
  p.touches.sort((a, b) => a.u - b.u);
  const first = p.touches[0]!.u;
  return {
    ...p,
    // Anyone on the ball in the first ten minutes started the match.
    from: first < 10 ? 0 : first - 0.5,
    to: p.touches.at(-1)!.u,
    mean: {
      x: p.touches.reduce((s, t) => s + t.x, 0) / p.touches.length,
      y: p.touches.reduce((s, t) => s + t.y, 0) / p.touches.length,
    },
  };
});

const TAU = 7;
const WINDOW = 20;
const ANCHOR = 0.8;

/** Every player on the pitch at minutes played `u`, at their recent average position. */
export function playersAt(u: number) {
  return ROSTER.flatMap((p) => {
    const presence =
      Math.min(1, Math.max(0, (u - p.from) / 0.8)) * Math.min(1, Math.max(0, (p.to + 2 - u) / 1));
    if (presence <= 0) return [];
    let w = ANCHOR;
    let x = ANCHOR * p.mean.x;
    let y = ANCHOR * p.mean.y;
    for (const t of p.touches) {
      const age = u - t.u;
      if (age < 0) break;
      if (age > WINDOW) continue;
      const k = Math.exp(-age / TAU) * smooth(Math.min(age / 0.6, 1));
      w += k;
      x += k * t.x;
      y += k * t.y;
    }
    return [{ x: x / w, y: y / w, argentina: p.argentina, n: p.n, presence: smooth(presence) }];
  });
}

/** The ball, sliding from one touch to the next. */
export function ballAt(u: number) {
  let i = ALL.findIndex((t) => t.u > u);
  if (i <= 0) i = i === 0 ? 1 : ALL.length - 1;
  const a = ALL[i - 1]!;
  const b = ALL[i]!;
  const t = b.u > a.u ? Math.min(Math.max((u - a.u) / (b.u - a.u), 0), 1) : 1;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/* Goal views --------------------------------------------------------------- */

interface GoalView {
  frame: number;
  argentina: boolean;
  moves: FinalMove[];
  shot: { x: number; y: number; endX: number; endY: number };
}
const toArg = (argentina: boolean, x: number, y: number) =>
  argentina ? { x, y } : { x: 120 - x, y: 80 - y };

function goalViews(T: Timeline): GoalView[] {
  return [
    ...T.GOALS.map((g) => ({
      frame: g.frame,
      argentina: g.team === F.home,
      moves: g.moves,
      shot: g,
    })),
    { frame: T.FRAME.save, argentina: false, moves: F.theSave.moves, shot: F.theSave },
  ];
}

/* Camera ------------------------------------------------------------------- */

const SWOOP = Easing.bezier(0.65, 0, 0.35, 1);
const WIDE = { x: 60, y: 40, turn: -32, tilt: 52, scale: 0.55, top: 445 };
/** The goal view for each side: the attacking half, turned so the goal is up and angled. */
const CLOSE = {
  argentina: { x: 110, y: 40, turn: -64, tilt: 56, scale: 1.2, top: 400 },
  france: { x: 10, y: 40, turn: 64, tilt: 56, scale: 1.2, top: 400 },
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Camera at zoom `k` (0 wide, 1 in the goal view): the pivot follows a bezier arc. */
function cameraAt(k: number, argentina: boolean, sway: number) {
  const to = argentina ? CLOSE.argentina : CLOSE.france;
  // Control point off to the touchline side, so the pivot curves in rather than sliding.
  const cx = (WIDE.x + to.x) / 2;
  const cy = 40 + (argentina ? 18 : -18);
  const b = (p0: number, p1: number, p2: number) =>
    (1 - k) * (1 - k) * p0 + 2 * (1 - k) * k * p1 + k * k * p2;
  return {
    x: b(WIDE.x, cx, to.x),
    y: b(WIDE.y, cy, to.y),
    turn: lerp(WIDE.turn + sway, to.turn, k),
    tilt: lerp(WIDE.tilt, to.tilt, k),
    scale: lerp(WIDE.scale, to.scale, k),
    top: lerp(WIDE.top, to.top, k),
  };
}

/** Numbers on the discs, kept upright against the camera's turn. */
function Numbers({ players, turn }: { players: ReturnType<typeof playersAt>; turn: number }) {
  const { transform } = usePitch();
  return (
    <>
      {players.map((p, i) => {
        if (p.n === null) return null;
        const [px, py] = transform.toPixel([p.x, p.y]);
        return (
          <text
            key={i}
            transform={`translate(${px} ${py}) rotate(${-turn})`}
            textAnchor="middle"
            dominantBaseline="central"
            opacity={p.presence}
            style={{
              font: `${34 * S}px Anton, Impact, sans-serif`,
              fill: p.argentina ? "#0b1830" : "#ffffff",
            }}
          >
            {p.n}
          </text>
        );
      })}
    </>
  );
}

function GoalMouth({ T, frame }: { T: Timeline; frame: number }) {
  const GX = 140;
  const GW = 800;
  const U = GW / 8;
  const GROUND = 520;
  const toX = (y: number) => GX + (y - 36) * U;
  const toY = (z: number) => GROUND - z * U;
  return (
    <svg width={1080} height={870} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 17 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={GX + (i * GW) / 16}
          y1={toY(2.67)}
          x2={GX + (i * GW) / 16}
          y2={GROUND}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={2}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={GX}
          y1={toY(2.67) + (i * 2.67 * U) / 6}
          x2={GX + GW}
          y2={toY(2.67) + (i * 2.67 * U) / 6}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={2}
        />
      ))}
      <path
        d={`M ${GX} ${GROUND} V ${toY(2.67)} H ${GX + GW} V ${GROUND}`}
        fill="none"
        stroke="white"
        strokeWidth={12}
        strokeLinejoin="round"
      />
      <line
        x1={40}
        y1={GROUND}
        x2={1040}
        y2={GROUND}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={4}
      />
      {T.KICKS.map((k, i) => {
        if (frame < k.frame) return null;
        const t = interpolate(frame, [k.frame, k.frame + 7], [0, 1], {
          ...clamp,
          easing: (v) => 1 - (1 - v) ** 2,
        });
        const x = 540 + (toX(k.y) - 540) * t;
        const y = 820 + (toY(k.z) - 820) * t;
        const color = k.team === F.home ? ARG : FRA;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={50 - 28 * t}
              fill={k.scored ? color : "transparent"}
              stroke={k.scored ? "white" : "#ef4444"}
              strokeWidth={6}
            />
            {!k.scored && t >= 1 && (
              <g stroke="#ef4444" strokeWidth={7} strokeLinecap="round">
                <line x1={x - 14} y1={y - 14} x2={x + 14} y2={y + 14} />
                <line x1={x + 14} y1={y - 14} x2={x - 14} y2={y + 14} />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** A small "drawn with" chip, shown while PitchKit marks are doing the work. */
function BrandChip({ label, opacity }: { label: string; opacity: number }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 34,
        bottom: 26,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: FONT.mono,
        fontSize: 22,
        color: C.accent,
        background: "rgba(4,6,12,0.82)",
        border: "1px solid rgba(52,211,153,0.35)",
        borderRadius: 999,
        padding: "7px 16px",
      }}
    >
      <Mark size={22} /> {label}
    </div>
  );
}

export function NetsPitch({
  T,
  frame,
  u,
  win,
}: {
  T: Timeline;
  frame: number;
  u: number;
  win: number;
}) {
  const views = goalViews(T);
  const view = views.find((v) => frame >= v.frame && frame <= v.frame + T.replay + 24);
  const p = view ? (frame - view.frame) / T.replay : 0;
  const shootout = interpolate(
    frame,
    [T.FRAME.whistle, T.FRAME.whistle + 14, T.CHAMPIONS - 4, T.CHAMPIONS + 10],
    [0, 1, 1, 0],
    clamp,
  );

  // Tilted like a broadcast camera, the pitch running bottom-left to top-right.
  // In a goal view it swoops into the attacking half: the pivot travels a
  // quadratic bezier arc while the turn, tilt and zoom ease on a cubic bezier.
  const sway = 3 * Math.sin(frame / 140);
  const zoomed = views.reduce<{ k: number; argentina: boolean }>(
    (best, v) => {
      const k = interpolate(frame - v.frame, [-2, 18, T.replay + 2, T.replay + 22], [0, 1, 1, 0], {
        ...clamp,
        easing: SWOOP,
      });
      return k > best.k ? { k, argentina: v.argentina } : best;
    },
    { k: 0, argentina: true },
  );
  const cam = cameraAt(zoomed.k, zoomed.argentina, sway);
  const turn = cam.turn;
  const camera = [
    `translate(540px, ${cam.top}px)`,
    "perspective(2200px)",
    `rotateX(${cam.tilt}deg)`,
    `rotateZ(${turn}deg)`,
    `scale(${cam.scale})`,
    `translate(${-(PAD.left + cam.x * K)}px, ${-(PAD.top + cam.y * K)}px)`,
  ].join(" ");

  const players = playersAt(u);
  const ball = ballAt(u);
  const dim = view
    ? 1 -
      0.55 *
        smooth(Math.min(p * 3, 1)) *
        smooth(Math.min((T.replay + 24 - (frame - view.frame)) / 12, 1))
    : 1;

  // The build-up draws in over the first 60% of the goal view, then the shot.
  let arrows: { x: number; y: number; x2: number; y2: number }[] = [];
  let carries: typeof arrows = [];
  let shot: typeof arrows = [];
  let viewFade = 0;
  let angle = 0;
  let shooter: { x: number; y: number }[] = [];
  if (view) {
    const moves = view.moves.slice(-5);
    const draw = interpolate(p, [0.28, 0.68], [0, moves.length], clamp);
    const drawn = moves
      .map((m, i) => ({ m, t: Math.min(Math.max(draw - i, 0), 1) }))
      .filter(({ t }) => t > 0)
      .map(({ m, t }) => {
        const a = toArg(view.argentina, m.x, m.y);
        const b = toArg(view.argentina, m.endX, m.endY);
        return {
          kind: m.kind,
          x: a.x,
          y: a.y,
          x2: a.x + (b.x - a.x) * t,
          y2: a.y + (b.y - a.y) * t,
        };
      });
    arrows = drawn.filter((m) => m.kind === "pass");
    carries = drawn.filter((m) => m.kind === "carry");
    angle = interpolate(p, [0.6, 0.72], [0, 1], clamp);
    const st = interpolate(p, [0.72, 0.88], [0, 1], { ...clamp, easing: (v) => v * v });
    const a = toArg(view.argentina, view.shot.x, view.shot.y);
    shooter = [a];
    if (st > 0) {
      const b = toArg(view.argentina, view.shot.endX, view.shot.endY);
      shot = [{ x: a.x, y: a.y, x2: a.x + (b.x - a.x) * st, y2: a.y + (b.y - a.y) * st }];
    }
    viewFade = interpolate(
      frame - view.frame,
      [0, 6, T.replay + 10, T.replay + 24],
      [0, 1, 1, 0],
      clamp,
    );
  }

  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - 0.8 * shootout }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: camera,
            transformStyle: "preserve-3d",
          }}
        >
          <PitchStage style={NIGHT}>
            <Pitch type="statsbomb" width={PW} height={PH} padding={PAD} appearance={appearance}>
              {win > 0 && <FlagOnPitch amount={win} />}
              <g opacity={dim * (1 - win)}>
                <Scatter
                  data={players}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  r={28 * S}
                  fill={(d) => (d.argentina ? ARG : FRA)}
                  fillOpacity={(d) => d.presence}
                  stroke="rgba(5,8,16,0.9)"
                  strokeWidth={3.5 * S}
                />
                <Numbers players={players} turn={turn} />
              </g>
              {!view && win < 1 && (
                <Scatter
                  data={[ball]}
                  x={(b) => b.x}
                  y={(b) => b.y}
                  r={9 * S}
                  fill="#fde047"
                  stroke="#000000"
                  fillOpacity={1 - win}
                  strokeWidth={2 * S}
                />
              )}
              {view && (
                <g opacity={viewFade}>
                  <g opacity={angle}>
                    <GoalAngle
                      data={shooter}
                      x={(d) => d.x}
                      y={(d) => d.y}
                      goal={view.argentina ? "right" : "left"}
                      fill="#fde047"
                      fillOpacity={0.22}
                      stroke="#fde047"
                      strokeWidth={2.5 * S}
                    />
                  </g>
                  <Comet
                    data={carries}
                    x={(m) => m.x}
                    y={(m) => m.y}
                    x2={(m) => m.x2}
                    y2={(m) => m.y2}
                    color="white"
                    gradient
                    endWidth={12 * S}
                  />
                  <Arrows
                    data={arrows}
                    x={(m) => m.x}
                    y={(m) => m.y}
                    x2={(m) => m.x2}
                    y2={(m) => m.y2}
                    stroke="white"
                    strokeWidth={6 * S}
                    headSize={20 * S}
                  />
                  <Comet
                    data={shot}
                    x={(m) => m.x}
                    y={(m) => m.y}
                    x2={(m) => m.x2}
                    y2={(m) => m.y2}
                    color="#fde047"
                    gradient
                    endWidth={18 * S}
                  />
                </g>
              )}
            </Pitch>
          </PitchStage>
          {zoomed.k > 0 && <StandingGoal argentina={zoomed.argentina} opacity={zoomed.k} />}
        </div>
      </div>
      {shootout > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: shootout }}>
          <GoalMouth T={T} frame={frame} />
        </div>
      )}
      <BrandChip label="<Arrows /> <Comet />" opacity={viewFade} />
    </>
  );
}

/**
 * The goal being attacked, standing up off the line in the camera's 3D space:
 * laid flat on the pitch from the goal line, then hinged up 90 degrees.
 */
function StandingGoal({ argentina, opacity }: { argentina: boolean; opacity: number }) {
  const W = 8 * K;
  const H = 2.67 * K;
  const nets = 8;
  return (
    <svg
      width={H}
      height={W}
      style={{
        position: "absolute",
        left: PAD.left + (argentina ? 120 : 0) * K,
        top: PAD.top + 36 * K,
        overflow: "visible",
        opacity,
        transformOrigin: "0 0",
        transform: "rotateY(-90deg)",
      }}
    >
      {Array.from({ length: nets + 1 }, (_, i) => (
        <line
          key={`n${i}`}
          x1={0}
          y1={(i * W) / nets}
          x2={H}
          y2={(i * W) / nets}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={1.5}
        />
      ))}
      {[1, 2].map((i) => (
        <line
          key={`h${i}`}
          x1={(i * H) / 3}
          y1={0}
          x2={(i * H) / 3}
          y2={W}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={1.5}
        />
      ))}
      <path
        d={`M 0 0 H ${H} V ${W} H 0`}
        fill="none"
        stroke="white"
        strokeWidth={5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Argentina's flag painted across the pitch: the bands sweep in, then the sun. */
function FlagOnPitch({ amount }: { amount: number }) {
  const { transform } = usePitch();
  const [x0, y0] = transform.toPixel([0, 0]);
  const [x1, y1] = transform.toPixel([120, 80]);
  const left = Math.min(x0, x1);
  const top = Math.min(y0, y1);
  const w = Math.abs(x1 - x0);
  const h = Math.abs(y1 - y0);
  const sweep = smooth(Math.min(amount / 0.7, 1));
  const sun = smooth(Math.max((amount - 0.55) / 0.45, 0));
  const [cx, cy] = transform.toPixel([60, 40]);
  const R = (h / 3) * 0.42;
  const rays = Array.from({ length: 16 }, (_, i) => (i * Math.PI) / 8);
  return (
    <g opacity={0.9}>
      <clipPath id="flag-sweep">
        <rect x={left} y={top} width={w * sweep} height={h} />
      </clipPath>
      <g clipPath="url(#flag-sweep)">
        <rect x={left} y={top} width={w} height={h} fill="#74acdf" />
        <rect x={left} y={top + h / 3} width={w} height={h / 3} fill="#ffffff" />
      </g>
      <g
        transform={`translate(${cx} ${cy}) scale(${sun}) rotate(${(1 - sun) * -90})`}
        fill="#f6b40e"
        stroke="#85340a"
        strokeWidth={2 * S}
      >
        {rays.map((a, i) => {
          const r = R * (i % 2 ? 0.9 : 1);
          return (
            <path
              key={i}
              d={`M ${Math.cos(a - 0.12) * R * 0.45} ${Math.sin(a - 0.12) * R * 0.45} L ${Math.cos(a) * r} ${Math.sin(a) * r} L ${Math.cos(a + 0.12) * R * 0.45} ${Math.sin(a + 0.12) * R * 0.45} Z`}
            />
          );
        })}
        <circle r={R * 0.48} />
      </g>
    </g>
  );
}
