/**
 * The goals cut's pitch. Between goals it is the network cut's tilted pitch:
 * every player a numbered disc drifting to where they've been on the ball.
 * For each goal the camera flattens into a bird's-eye view of the attacking
 * half and the three moves before the goal play one per beat on StatsBomb
 * 360 data: the players the broadcast camera could see glide from one
 * frame to the next, the space each controlled (a Voronoi cell) morphs with
 * them, each move draws in, and the shot goes in with its goal angle.
 *
 * 360 frames are seconds apart within a build-up, so players are paired
 * frame to frame by nearest team-mate and slid; anyone unpaired fades. Only
 * the player on the ball is named (from the event), and the Voronoi fades out
 * towards the edge of what the camera saw.
 */
import { Arrows, Comet, GoalAngle, Pitch, Scatter, usePitch, Voronoi } from "@pitchkit/react";
import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";
import { PitchStage } from "../../components/Chrome";
import { wcGoals360 } from "../../data";
import type { GoalStep } from "../../data";
import { appearance, FONT, PAD } from "../../theme";
import {
  ballAt,
  BrandChip,
  FlagOnPitch,
  GoalMouth,
  K,
  lerp,
  Numbers,
  PH,
  playersAt,
  PW,
  S,
  smooth,
  SWOOP,
  WIDE,
} from "./NetsPitch";
import { ARG, FRA } from "./scene360";
import type { Timeline } from "./timeline";
import { GOAL_LEAD, GOALS_CUT_BEATS as B } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Reel 05's broadcast grass: bright stripes and crisp white lines. */
const GRASS = {
  "--pitch-surface": "#15693a",
  "--pitch-stripe": "rgba(255, 255, 255, 0.07)",
  "--pitch-lines": "rgba(255, 255, 255, 0.9)",
} as CSSProperties;
const glide = Easing.inOut(Easing.cubic);

/* 360 tracks ------------------------------------------------------------------ */

type Dot = { x: number; y: number; team: "A" | "F"; actor: boolean; keeper: boolean };
interface Segment {
  from: Dot | null;
  to: Dot | null;
}

/** Pair each player in `a` with the nearest team-mate in `b` (greedy, within 15 units). */
function pair(a: Dot[], b: Dot[]): Segment[] {
  const pairs: { i: number; j: number; d: number }[] = [];
  a.forEach((p, i) =>
    b.forEach((q, j) => {
      if (p.team !== q.team) return;
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < 15) pairs.push({ i, j, d });
    }),
  );
  pairs.sort((m, n) => m.d - n.d);
  const usedA = new Set<number>();
  const usedB = new Set<number>();
  const out: Segment[] = [];
  for (const { i, j } of pairs) {
    if (usedA.has(i) || usedB.has(j)) continue;
    usedA.add(i);
    usedB.add(j);
    out.push({ from: a[i]!, to: b[j]! });
  }
  a.forEach((p, i) => usedA.has(i) || out.push({ from: p, to: null }));
  b.forEach((q, j) => usedB.has(j) || out.push({ from: null, to: q }));
  return out;
}

interface Build {
  argentina: boolean;
  /** A penalty: the build-up ends at a foul, then the kick from the spot. */
  penalty: boolean;
  steps: GoalStep[];
  /** Step indices that have a 360 frame. */
  keys: number[];
  /** Segments between consecutive keys. */
  segments: Segment[][];
  /** Where the camera looks, and how close, in the 870 px pitch box. */
  close: Close;
  /** The same for the full-height cold open. */
  intro: Close;
}

interface Close {
  x: number;
  y: number;
  turn: number;
  scale: number;
}

/**
 * Bird's-eye over the attacking half, the goal near the top of the screen:
 * as close as fits the whole build-up (screen `height` px tall) and the
 * pitch's width, centred so neither touchline leaves a gap.
 */
function framing(argentina: boolean, steps: GoalStep[], height: number): Close {
  // Distance from the goal line, so both directions read the same way.
  const depth = (x: number) => (argentina ? 120 - x : x);
  const deepest = Math.max(...steps.flatMap((s) => [depth(s.x), depth(s.endX)])) + 4;
  const scale = Math.min(
    Math.max(Math.min(1080 / (80 * K), height / ((deepest + 6) * K)), 0.8),
    1.4,
  );
  const halfWide = 540 / (K * scale);
  const halfTall = height / 2 / (K * scale);
  const ys = steps.flatMap((s) => [s.y, s.endY]);
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const y = halfWide >= 40 ? 40 : Math.min(Math.max(cy, halfWide), 80 - halfWide);
  // The goal line sits 4 units below the top edge.
  const fromGoal = halfTall - 4;
  return {
    x: argentina ? 120 - fromGoal : fromGoal,
    y,
    turn: argentina ? -90 : 90,
    scale,
  };
}

/** The cold open: tight on the build-up itself, the goal still off the top of the screen. */
function tight(argentina: boolean, steps: GoalStep[]): Close {
  const moves = steps.slice(0, 3);
  const xs = moves.flatMap((s) => [s.x, s.endX]);
  const ys = moves.flatMap((s) => [s.y, s.endY]);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
    turn: argentina ? -90 : 90,
    scale: 1.45,
  };
}

const BUILDS: Build[] = wcGoals360.goals.map((g) => {
  const keys = g.steps.flatMap((s, i) => (s.frame ? [i] : []));
  const segments = keys
    .slice(1)
    .map((k, i) => pair(g.steps[keys[i]!]!.frame!.players, g.steps[k]!.frame!.players));
  const argentina = g.team === "A";
  return {
    argentina,
    penalty: g.penalty,
    steps: g.steps,
    keys,
    segments,
    close: framing(argentina, g.steps, 860),
    intro: tight(argentina, g.steps),
  };
});

/** Everyone the camera saw at step-time `s` (0 = the first move, 3 = the shot). */
function dotsAt(b: Build, s: number) {
  const { keys, segments, steps } = b;
  /** The player on the ball in step `i`'s frame carries that step's shirt number. */
  const held = (i: number) =>
    steps[i]!.frame!.players.map((p) => ({ ...p, n: p.actor ? steps[i]!.n : null, o: 1 }));
  if (s <= keys[0]!) return held(keys[0]!);
  if (s >= keys.at(-1)!) return held(keys.at(-1)!);
  const k = keys.findIndex((key, i) => s >= key && s < keys[i + 1]!);
  const f = glide((s - keys[k]!) / (keys[k + 1]! - keys[k]!));
  const nFrom = steps[keys[k]!]!.n;
  const nTo = steps[keys[k + 1]!]!.n;
  return segments[k]!.map(({ from, to }) => {
    if (from && to) {
      const actor = f < 0.5 ? from.actor : to.actor;
      return {
        x: lerp(from.x, to.x, f),
        y: lerp(from.y, to.y, f),
        team: to.team,
        actor,
        keeper: to.keeper,
        n: actor ? (f < 0.5 ? nFrom : nTo) : null,
        o: 1,
      };
    }
    const p = (from ?? to)!;
    return { ...p, n: p.actor ? (from ? nFrom : nTo) : null, o: from ? 1 - f : f };
  });
}

/** The camera's view at step-time `s`: the nearest key's visible area. */
function areaAt(b: Build, s: number) {
  const key = b.keys.reduce((best, k) => (Math.abs(k - s) < Math.abs(best - s) ? k : best));
  return b.steps[key]!.frame!.area;
}

/* Timing ---------------------------------------------------------------------- */

interface ViewState {
  build: Build;
  index: number;
  /** Camera zoom: 0 wide, 1 bird's-eye. */
  k: number;
  /** Step-time: 0..3 the moves, 3..4 the shot. */
  s: number;
  /** 0..1 once the ball is in. */
  after: number;
  /** The full-height cold open. */
  intro: boolean;
}

/** Step-time at frame 0 of the cold open: Messi's pass has only just left his foot. */
const INTRO_S0 = 0.1;

function viewAt(T: Timeline, frame: number): ViewState | null {
  // The cold open: Di María's build-up, stopping short of the shot. Frame 0 is
  // already halfway through the zoom from the tilted pitch into bird's-eye, so
  // the first thing on screen is the camera moving and Messi's pass drawing in.
  if (frame < B.intro) {
    const zoomIn = interpolate(frame, [0, 16], [0.5, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const pullOut = interpolate(frame, [B.intro - 14, B.intro], [1, 0], {
      ...clamp,
      easing: SWOOP,
    });
    return {
      build: BUILDS[1]!,
      index: 1,
      k: Math.min(zoomIn, pullOut),
      s: Math.min(INTRO_S0 + frame / 17, 2.95),
      after: 0,
      intro: true,
    };
  }
  for (const [index, g] of T.GOALS.entries()) {
    const t = frame - (g.frame - GOAL_LEAD);
    if (t < 0 || t > GOAL_LEAD + B.tail) continue;
    return {
      build: BUILDS[index]!,
      index,
      k: interpolate(t, [0, B.morph, GOAL_LEAD + B.tail - 16, GOAL_LEAD + B.tail], [0, 1, 1, 0], {
        ...clamp,
        easing: SWOOP,
      }),
      s: interpolate(t, [B.morph, B.morph + 3 * B.step, GOAL_LEAD], [0, 3, 4], clamp),
      after: interpolate(t, [GOAL_LEAD, GOAL_LEAD + 6], [0, 1], clamp),
      intro: false,
    };
  }
  return null;
}

/** Step times at which each move starts: the build-up's ticks, for the sound. */
export function goalsCutStepCues(T: Timeline) {
  const intro = [0, 1, 2].map((j) => Math.max(0, Math.round((j - INTRO_S0) * 17)));
  const goals = T.GOALS.flatMap((g, i) =>
    [0, 1, 2]
      .filter((j) => BUILDS[i]!.steps[j]!.kind !== "foul")
      .map((j) => g.frame - GOAL_LEAD + B.morph + j * B.step),
  );
  return [...intro, ...goals];
}

/** Frames at which a penalty's foul lands: the buzz. */
export function goalsCutFoulCues(T: Timeline) {
  return T.GOALS.flatMap((g, i) => {
    const j = BUILDS[i]!.steps.findIndex((m) => m.kind === "foul");
    return j >= 0 && j < 3 ? [g.frame - GOAL_LEAD + B.morph + j * B.step] : [];
  });
}

/* Labels ---------------------------------------------------------------------- */

const upper = (name: string | null) => (name ?? "").toUpperCase();
function stepLabel(step: GoalStep) {
  if (step.kind === "pass") return `${upper(step.player)} → ${upper(step.to)}`;
  if (step.kind === "carry") return `${upper(step.player)} RUNS AT THEM`;
  if (step.kind === "shot") return `${upper(step.player)} SHOOTS · ${upper(step.outcome)}`;
  if (step.kind === "foul")
    return `${upper(step.player)} ${step.foul === "handball" ? "HANDBALL" : "FOUL"} · PENALTY`;
  return "";
}

function StepChip({ view, top }: { view: ViewState; top: number }) {
  const j = Math.floor(view.s);
  if (j > 2 || view.k < 0.6) return null;
  const local = view.s - j;
  const t = interpolate(local, [0, 0.25], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const color = view.build.argentina ? ARG : FRA;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: Math.min(t * 1.5, 1),
        transform: `translateY(${(1 - t) * -16}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "rgba(0,0,0,0.8)",
          border: `2px solid ${color}`,
          borderRadius: 999,
          padding: "10px 26px 10px 12px",
          fontFamily: FONT.display,
          fontSize: 44,
          lineHeight: 1,
          color: "white",
        }}
      >
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            background: color,
            color: "#04140b",
            display: "grid",
            placeItems: "center",
            fontSize: 32,
          }}
        >
          {j + 1}
        </span>
        {stepLabel(view.build.steps[j]!)}
      </div>
    </div>
  );
}

/* The 360 layer ----------------------------------------------------------------- */

function Space360({ view }: { view: ViewState }) {
  const { transform } = usePitch();
  const { build, s, k, index } = view;
  // A penalty strips back to the taker alone as the kick comes up.
  const spot = build.penalty ? interpolate(s, [2.55, 2.95], [0, 1], clamp) : 0;
  const dots = dotsAt(build, s)
    .map((d) => ({ ...d, o: d.o * (d.actor && s > 2.5 ? 1 : 1 - spot) }))
    .filter((d) => d.o > 0.01);
  const area = areaAt(build, s).map((p) => transform.toPixel(p));
  const turn = build.close.turn;
  // The cold open starts mid-zoom with everything already on; goal views fade in.
  const fade = view.intro
    ? smooth(Math.min(k / 0.5, 1))
    : smooth(Math.min(Math.max((k - 0.4) / 0.6, 0), 1));
  const id = `cam-${index}`;
  return (
    <g opacity={fade}>
      <defs>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={14 * S} />
        </filter>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse">
          <polygon
            points={area.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="white"
            filter={`url(#${id}-soft)`}
          />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`} opacity={1 - spot}>
        <Voronoi
          data={dots}
          x={(d) => d.x}
          y={(d) => d.y}
          fill={(d) => (d.team === "A" ? ARG : FRA)}
          fillOpacity={(d) => 0.3 * d.o}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={1.5 * S}
        />
      </g>
      <Scatter
        data={dots}
        x={(d) => d.x}
        y={(d) => d.y}
        r={(d) => (d.actor ? 17 : 12) * S}
        fill={(d) => (d.team === "A" ? ARG : FRA)}
        fillOpacity={(d) => d.o}
        stroke={(d) => (d.actor ? `rgba(255,255,255,${d.o})` : `rgba(0,0,0,${0.85 * d.o})`)}
        strokeWidth={(d) => (d.actor ? 4 : 2) * S}
      />
      {dots
        .filter((d) => d.actor && d.n !== null && d.o > 0.5)
        .map((d, i) => {
          const [px, py] = transform.toPixel([d.x, d.y]);
          return (
            <text
              key={i}
              transform={`translate(${px} ${py}) rotate(${-turn})`}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                font: `${20 * S}px Anton, Impact, sans-serif`,
                fill: d.team === "A" ? "#0b1830" : "#ffffff",
              }}
            >
              {d.n}
            </text>
          );
        })}
    </g>
  );
}

/**
 * The moves as snail trails: each line's tail chases its head, so a move is
 * gone a beat after it's made and the pitch is clear when the shot comes.
 */
function Moves({ view }: { view: ViewState }) {
  const { build, s, after } = view;
  const { transform } = usePitch();
  const drawn = build.steps.slice(0, 3).flatMap((m, j) => {
    if (m.kind === "foul") return [];
    const head = glide(Math.min(Math.max(s - j, 0), 1));
    const tail = glide(Math.min(Math.max((s - j - 0.35) / 0.65, 0), 1));
    if (head - tail < 0.03) return [];
    return [
      {
        kind: m.kind,
        x: lerp(m.x, m.endX, tail),
        y: lerp(m.y, m.endY, tail),
        x2: lerp(m.x, m.endX, head),
        y2: lerp(m.y, m.endY, head),
      },
    ];
  });
  const goal = build.steps[3]!;
  const st = Easing.in(Easing.quad)(Math.min(Math.max(s - 3, 0), 1));
  const shot =
    st > 0
      ? [{ x: goal.x, y: goal.y, x2: lerp(goal.x, goal.endX, st), y2: lerp(goal.y, goal.endY, st) }]
      : [];
  // The foul: a small red cross that pops in with a buzz, then clears for the kick.
  const foulAt = build.steps.findIndex((m) => m.kind === "foul");
  const foul = foulAt >= 0 && foulAt < 3 && s >= foulAt ? build.steps[foulAt]! : null;
  const local = s - foulAt;
  const pop = Easing.out(Easing.back(3))(Math.min(local / 0.18, 1));
  const buzz = local < 0.45 ? Math.sin(local * 90) * 7 * S * (1 - local / 0.45) : 0;
  const foulFade = interpolate(s, [2.75, 3], [1, 0], clamp);
  const [fx, fy] = foul ? transform.toPixel([foul.x, foul.y]) : [0, 0];
  return (
    <g>
      <Comet
        data={drawn.filter((m) => m.kind === "carry")}
        x={(m) => m.x}
        y={(m) => m.y}
        x2={(m) => m.x2}
        y2={(m) => m.y2}
        color="white"
        gradient
        endWidth={11 * S}
      />
      <Arrows
        data={drawn.filter((m) => m.kind === "pass" || m.kind === "shot")}
        x={(m) => m.x}
        y={(m) => m.y}
        x2={(m) => m.x2}
        y2={(m) => m.y2}
        stroke="white"
        strokeWidth={5 * S}
        headSize={18 * S}
      />
      {foul && foulFade > 0 && (
        <g
          transform={`translate(${fx + buzz} ${fy - buzz * 0.4}) scale(${pop})`}
          opacity={foulFade}
          stroke="#ef4444"
          strokeWidth={7 * S}
          strokeLinecap="round"
        >
          <line x1={-14 * S} y1={-14 * S} x2={14 * S} y2={14 * S} />
          <line x1={14 * S} y1={-14 * S} x2={-14 * S} y2={14 * S} />
        </g>
      )}
      {s >= 2.85 && (
        <g opacity={interpolate(s, [2.85, 3.1], [0, 1], clamp)}>
          <GoalAngle
            data={[goal]}
            x={(d) => d.x}
            y={(d) => d.y}
            goal={build.argentina ? "right" : "left"}
            fill="#fde047"
            fillOpacity={0.22 + 0.1 * after}
            stroke="#fde047"
            strokeWidth={2.5 * S}
          />
        </g>
      )}
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
  );
}

/* The pitch ------------------------------------------------------------------- */

export function GoalsPitch({
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
  const view = viewAt(T, frame);
  const k = view?.k ?? 0;
  const shootout = interpolate(
    frame,
    [T.FRAME.whistle, T.FRAME.whistle + 14, T.CHAMPIONS - 4, T.CHAMPIONS + 10],
    [0, 1, 1, 0],
    clamp,
  );

  // Tilted like a broadcast camera; in a goal view it flattens to bird's-eye
  // over the attacking half, the pivot curving in along a bezier arc.
  const sway = 3 * Math.sin(frame / 140);
  const to = view
    ? view.intro
      ? view.build.intro
      : view.build.close
    : { x: WIDE.x, y: WIDE.y, turn: WIDE.turn, scale: WIDE.scale };
  const cx = (WIDE.x + to.x) / 2;
  const cy = 40 + (view && !view.build.argentina ? -16 : 16);
  const bez = (p0: number, p1: number, p2: number) =>
    (1 - k) * (1 - k) * p0 + 2 * (1 - k) * k * p1 + k * k * p2;
  const cam = {
    x: bez(WIDE.x, cx, to.x),
    y: bez(WIDE.y, cy, to.y),
    turn: lerp(WIDE.turn + sway, to.turn, k),
    tilt: lerp(WIDE.tilt, 0, k),
    scale: lerp(WIDE.scale, to.scale, k),
    top: lerp(WIDE.top, view?.intro ? 1060 - 400 : 435, k),
  };
  const camera = [
    `translate(540px, ${cam.top}px)`,
    "perspective(2200px)",
    `rotateX(${cam.tilt}deg)`,
    `rotateZ(${cam.turn}deg)`,
    `scale(${cam.scale})`,
    `translate(${-(PAD.left + cam.x * K)}px, ${-(PAD.top + cam.y * K)}px)`,
  ].join(" ");

  // The step label sits just above the halfway line, wherever the camera has
  // put it, kept on screen (the cold open runs full height).
  const towardsGoal = !view || view.build.argentina ? 1 : -1;
  const halfway = cam.top + towardsGoal * (cam.x - 60) * K * cam.scale;
  const chipTop = Math.min(Math.max(halfway - 92, 120), view?.intro ? 1300 : 740);

  const players = playersAt(u);
  const ball = ballAt(u);
  const wide = 1 - smooth(Math.min(k / 0.6, 1));

  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - shootout }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: camera,
          }}
        >
          <PitchStage style={GRASS}>
            <Pitch type="statsbomb" width={PW} height={PH} padding={PAD} appearance={appearance}>
              {win > 0 && <FlagOnPitch amount={win} />}
              {wide > 0 && (
                <g opacity={wide * (1 - win)}>
                  <Scatter
                    data={players}
                    x={(d) => d.x}
                    y={(d) => d.y}
                    r={28 * S}
                    fill={(d) => (d.argentina ? ARG : FRA)}
                    fillOpacity={(d) => d.presence}
                    stroke="rgba(0,0,0,0.9)"
                    strokeWidth={3.5 * S}
                  />
                  <Numbers players={players} turn={cam.turn} />
                  {win < 1 && (
                    <Scatter
                      data={[ball]}
                      x={(b) => b.x}
                      y={(b) => b.y}
                      r={9 * S}
                      fill="#fde047"
                      fillOpacity={1 - win}
                      stroke="#000000"
                      strokeWidth={2 * S}
                    />
                  )}
                </g>
              )}
              {view && (
                <g opacity={view.k > 0 ? 1 : 0}>
                  <Space360 view={view} />
                  <g
                    opacity={
                      view.intro
                        ? smooth(Math.min(view.k / 0.5, 1))
                        : smooth(Math.min(Math.max((view.k - 0.5) / 0.5, 0), 1))
                    }
                  >
                    <Moves view={view} />
                  </g>
                </g>
              )}
            </Pitch>
          </PitchStage>
        </div>
      </div>
      {view && <StepChip view={view} top={chipTop} />}
      {shootout > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: shootout }}>
          <GoalMouth T={T} frame={frame} />
        </div>
      )}
      <BrandChip
        label="<Voronoi /> <Arrows /> <GoalAngle />"
        opacity={view && frame >= B.intro ? Math.min(view.after, view.k) : 0}
      />
    </>
  );
}
