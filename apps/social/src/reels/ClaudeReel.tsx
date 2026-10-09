/**
 * Reel 07: "Football analysis is for coders. Not anymore." In under 30
 * seconds: the hook flips a belief (rule 25), then three value beats show the
 * real thing. 1, the prompt. 2, the component Claude wrote with PitchKit's agent
 * skill (src/reels/claude/DiMariaGoal.tsx, shown as written). 3, what it draws:
 * the reel runs that component, unchanged, on StatsBomb's own events and
 * lineups for the match (local copies, since the renderer has no network; see
 * scripts/snapshot-claude-demo.mjs). Then the payoff and the setup line.
 *
 * The reel only stages what the component draws: a camera over it, reel 05's
 * grass through PitchKit's CSS variables, and per-frame CSS that draws each
 * mark in on its beat. The marks themselves are the component's.
 */
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EndCard } from "../components/EndCard";
import { Mark } from "../components/Logo";
import codeJson from "../data/claude-demo-code.json";
import rawEvents from "../data/claude-demo-events.json";
import rawLineups from "../data/claude-demo-lineups.json";
import { C, FONT } from "../theme";
import DiMariaGoal from "./claude/DiMariaGoal";
import { CLAUDE_ORANGE, CLAUDE_SPARK } from "./claude/marks";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = Easing.out(Easing.back(2.2));
const smooth = Easing.inOut(Easing.cubic);

/* Timeline (30 fps) ------------------------------------------------------- */

const ASK = 75;
const CODE = 225;
const DRAW = 435;
const CTA = 660;
const END_AT = 810;
export const CLAUDE_DURATION = END_AT + 75;

/** The hook: the strike lands, then the flip. */
const STRIKE = [11, 17] as const;
const FLIP = 24;

const PROMPT =
  "Show me the three passes before Di María's goal in the 2022 World Cup final: who passed, when, and his shirt number. Use PitchKit and StatsBomb's free data.";
/** The prompt types in over these frames after ASK. */
const TYPE_FROM = 10;
const TYPE_TO = 108;

/* Running Claude's component ------------------------------------------------ */

const LOCAL: Record<string, unknown> = {
  "/events/3869685.json": rawEvents,
  "/lineups/3869685.json": rawLineups,
};

/**
 * Calls the component Claude wrote and returns what it rendered. Its two
 * network calls, StatsBomb's events and lineups files, are answered from the
 * local copies.
 */
function useClaudeOutput() {
  const [node, setNode] = useState<ReactNode>(null);
  const [handle] = useState(() => delayRender("Running Claude's component"));
  useEffect(() => {
    const real = window.fetch;
    window.fetch = async (input, init) => {
      const hit = Object.keys(LOCAL).find((path) => String(input).endsWith(path));
      if (hit) {
        return new Response(JSON.stringify(LOCAL[hit]), {
          headers: { "content-type": "application/json" },
        });
      }
      return real(input, init);
    };
    DiMariaGoal()
      .then((element) => setNode(element))
      .finally(() => {
        window.fetch = real;
        continueRender(handle);
      });
  }, [handle]);
  return node;
}

/* Staging the output ---------------------------------------------------------- */

/** The component's crop (x 50–120, all of y), and the size it is laid out at. */
const CROP = { x0: 34, x1: 124, y1: 80 };
const CHART_W = 360;
const CHART_H = (CHART_W * CROP.y1) / (CROP.x1 - CROP.x0);
const px = (x: number, y: number) => [
  ((x - CROP.x0) / (CROP.x1 - CROP.x0)) * CHART_W,
  (y / CROP.y1) * CHART_H,
];

/**
 * Where the drawn marks are, for the camera and the draw-on. Read from the
 * same events the component reads (the snapshot keeps every shot plus the
 * goal's possession, so the goal's possession's passes are all passes here).
 */
type Raw = {
  type: { name: string };
  possession: number;
  location?: number[];
  pass?: { end_location: number[] };
  shot?: { outcome: { name: string }; end_location: number[] };
  player?: { name: string };
};
const EVENTS = rawEvents as Raw[];
const GOAL = EVENTS.find(
  (e) =>
    e.type.name === "Shot" &&
    e.shot?.outcome.name === "Goal" &&
    e.player?.name.includes("Di María"),
)!;
const MOVES = EVENTS.filter((e) => e.type.name === "Pass" && e.possession === GOAL.possession)
  .slice(-3)
  .map((e) => ({ from: e.location!, to: e.pass!.end_location }));
const SHOT = { from: GOAL.location!, to: GOAL.shot!.end_location };
/** A pass's length in chart pixels (the transform is uniform). */
const lengthOf = (m: { from: number[]; to: number[] }) =>
  (Math.hypot(m.to[0]! - m.from[0]!, m.to[1]! - m.from[1]!) * CHART_W) / (CROP.x1 - CROP.x0);

const PASSERS = ["MESSI", "ÁLVAREZ", "MAC ALLISTER", "DI MARÍA"];

/** Draw beat timings, in frames after DRAW. */
const PASS_AT = [16, 44, 72];
const PASS_LEN = 18;
const RECEIVED = PASS_AT.map((t) => t + PASS_LEN);
const SHOT_AT = RECEIVED[2]! + 10;
const SHOT_LEN = 9;

/** How far each mark has drawn, 0..1, at frame `t` of the draw beat. */
function progress(t: number) {
  const ease = (from: number, len: number) =>
    interpolate(t, [from, from + len], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  return {
    passes: PASS_AT.map((at) => ease(at, PASS_LEN)),
    labels: PASS_AT.map((at) => ease(at - 2, 8)),
    heads: RECEIVED.map((at) => ease(at - 3, 6)),
    shooter: ease(RECEIVED[2]! - 2, 8),
    shot: ease(SHOT_AT, SHOT_LEN),
    angle: ease(SHOT_AT + 2, 12),
  };
}

/**
 * Per-frame CSS that draws the component's marks in: each pass's shaft by its
 * dash offset, its arrowhead and label popping in, then the shooter, the shot
 * and the goal angle growing from the shooter. Selectors follow the
 * component's layer order.
 */
function drawCss(p: ReturnType<typeof progress>) {
  const scope = ".claude-out";
  const [sx, sy] = px(SHOT.from[0]!, SHOT.from[1]!);
  const grow = (k: number) =>
    `opacity:${Math.min(1, k * 3)};transform-box:view-box;transform-origin:${sx}px ${sy}px;transform:scale(${k});`;
  const popIn = (k: number) =>
    `opacity:${Math.min(1, k * 2)} !important;transform-box:fill-box;transform-origin:center;transform:scale(${interpolate(k, [0, 0.7, 1], [0.2, 1.25, 1])});`;
  const rules = MOVES.map((m, i) => {
    const len = lengthOf(m) + 2;
    const arrow = `${scope} [data-pitchkit-layer="arrows"] > g:nth-of-type(${i + 1})`;
    const label = `${scope} [data-pitchkit-layer="arrows"] + [data-pitchkit-layer="annotate"] > text:nth-of-type(${i + 1})`;
    return [
      `${arrow} line{stroke-dasharray:${len} ${len};stroke-dashoffset:${len * (1 - p.passes[i]!)};}`,
      `${arrow} polygon{${popIn(p.heads[i]!)}}`,
      `${label}{${popIn(p.labels[i]!)}}`,
    ].join("\n");
  });
  return [
    ...rules,
    `${scope} [data-pitchkit-layer="scatter"] circle{${popIn(p.shooter)}}`,
    `${scope} [data-pitchkit-layer="scatter"] + [data-pitchkit-layer="annotate"] text{${popIn(p.shooter)}}`,
    `${scope} [data-pitchkit-layer="comet"] polygon{${grow(p.shot)}}`,
    `${scope} [data-pitchkit-layer="goal-angle"] polygon{${grow(p.angle)}}`,
  ].join("\n");
}

/** Reel 05's grass, set through PitchKit's CSS variables. */
const GRASS = {
  "--pitch-surface": "#15693a",
  "--pitch-stripe": "rgba(255, 255, 255, 0.07)",
  "--pitch-lines": "rgba(255, 255, 255, 0.9)",
} as CSSProperties;

/**
 * Labels a phone can read: the component's own text, in the reel's type. Pass
 * labels sit on a dark chip (an SVG filter flooding the text's box); the
 * shirt number keeps a thin outline on its dot.
 */
const PASS_LABELS = `.claude-out [data-pitchkit-layer="arrows"] + [data-pitchkit-layer="annotate"] text`;
const TEXT_CSS = [
  `.claude-out [data-pitchkit-mark="annotate"]{font-family:Inter,sans-serif;font-weight:800;}`,
  `${PASS_LABELS}{font-weight:700;letter-spacing:0.2px;filter:url(#claude-chip);}`,
  `.claude-out [data-pitchkit-layer="scatter"] + [data-pitchkit-layer="annotate"] text{paint-order:stroke;stroke:rgba(4,20,11,0.7);stroke-width:1.4px;}`,
].join("\n");

function ChipFilter() {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id="claude-chip" x="-9%" y="-28%" width="118%" height="150%">
        <feFlood floodColor="#04140b" floodOpacity={0.88} result="chip" />
        <feComposite in="SourceGraphic" in2="chip" operator="over" />
      </filter>
    </svg>
  );
}

type Camera = { x: number; y: number; zoom: number };

/**
 * Claude's output in a viewport the camera moves over. The component lays out
 * at CHART_W (a phone-sized chart) and is scaled up, so its lines and labels
 * keep their proportions; `camera` centres a pitch point at a zoom, held
 * inside the pitch's edges.
 */
function Output({
  node,
  width,
  height,
  top,
  camera,
  css,
}: {
  node: ReactNode;
  width: number;
  height: number;
  top: number;
  camera: Camera;
  css: string;
}) {
  const scale = (width / CHART_W) * camera.zoom;
  const hold = (v: number, size: number, view: number) => {
    const half = view / 2 / scale;
    return size <= 2 * half ? size / 2 : Math.min(Math.max(v, half), size - half);
  };
  const [cx, cy] = px(camera.x, camera.y);
  const x = hold(cx!, CHART_W, width);
  const y = hold(cy!, CHART_H, height);
  return (
    <div
      className="claude-out"
      style={{
        position: "absolute",
        left: (1080 - width) / 2,
        top,
        width,
        height,
        overflow: "hidden",
        borderRadius: 20,
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        // Run-off behind the goal line, where the component draws no grass.
        background: "#125a32",
        ...GRASS,
      }}
    >
      <ChipFilter />
      <style>{TEXT_CSS + "\n" + css}</style>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CHART_W,
          height: CHART_H,
          transformOrigin: "0 0",
          transform: `translate(${width / 2}px, ${height / 2}px) scale(${scale}) translate(${-x}px, ${-y}px)`,
        }}
      >
        {node}
      </div>
    </div>
  );
}

/** Camera keyframes over a beat: frames, then where it looks. */
function track(t: number, keys: [number, Camera][]): Camera {
  const at = keys.map(([f]) => f);
  const get = (k: keyof Camera) =>
    interpolate(
      t,
      at,
      keys.map(([, c]) => c[k]),
      { ...clamp, easing: smooth },
    );
  return { x: get("x"), y: get("y"), zoom: get("zoom") };
}
const mid = (m: { from: number[]; to: number[] }, zoom: number): Camera => ({
  x: (m.from[0]! + m.to[0]!) / 2,
  y: (m.from[1]! + m.to[1]!) / 2,
  zoom,
});

/* Pieces ------------------------------------------------------------------- */

const big = (size: number, color: string = C.text): CSSProperties => ({
  fontFamily: FONT.display,
  fontSize: size,
  lineHeight: 0.95,
  color,
});

function StepChip({
  frame,
  at,
  n,
  label,
}: {
  frame: number;
  at: number;
  n: number;
  label: string;
}) {
  const t = interpolate(frame, [at, at + 8], [0, 1], { ...clamp, easing: pop });
  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 60,
        display: "flex",
        alignItems: "center",
        gap: 18,
        opacity: Math.min(t * 1.5, 1),
        transform: `translateX(${(1 - t) * -40}px)`,
      }}
    >
      <span
        style={{
          ...big(52, "#04140b"),
          width: 74,
          height: 74,
          borderRadius: 37,
          background: C.accent,
          display: "grid",
          placeItems: "center",
        }}
      >
        {n}
      </span>
      <span style={big(76)}>{label}</span>
    </div>
  );
}

/* Hook ------------------------------------------------------------------------ */

function Hook({ frame, node }: { frame: number; node: ReactNode }) {
  const strike = interpolate(frame, [...STRIKE], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  // The thump: the headline jolts as the strike lands, and settles.
  const jolt = frame >= STRIKE[1] ? Math.exp(-(frame - STRIKE[1]) / 3) : 0;
  const shake = jolt * 14 * Math.sin((frame - STRIKE[1]) * 2.4);
  const flip = interpolate(frame, [FLIP, FLIP + 10], [0, 1], { ...clamp, easing: pop });
  const out = interpolate(frame, [ASK - 10, ASK], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Output
        node={node}
        width={900}
        height={1180}
        top={600}
        camera={track(frame, [
          [0, { x: 98, y: 46, zoom: 1.5 }],
          [ASK, { x: 108, y: 42, zoom: 1.8 }],
        ])}
        css=""
      />
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 60,
          right: 60,
          transform: `translate(${shake}px, ${jolt * 6}px) scale(${1 + jolt * 0.04})`,
          transformOrigin: "left center",
        }}
      >
        <div style={big(104)}>FOOTBALL ANALYSIS</div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              ...big(104),
              opacity: 1 - 0.45 * Math.min(1, jolt + (frame > STRIKE[1] ? 1 : 0)),
            }}
          >
            IS FOR CODERS.
          </div>
          <div
            style={{
              position: "absolute",
              left: -8,
              top: "48%",
              height: 16,
              width: `calc(${strike * 100}% + 16px)`,
              opacity: strike > 0 ? 1 : 0,
              background: "#ef4444",
              borderRadius: 8,
              transform: "rotate(-3deg)",
              boxShadow: `0 0 ${24 * jolt}px rgba(239,68,68,0.9)`,
            }}
          />
        </div>
        <div
          style={{
            ...big(124, C.accent),
            marginTop: 14,
            opacity: Math.min(flip * 1.4, 1),
            transform: `scale(${0.6 + 0.4 * flip})`,
            transformOrigin: "left center",
          }}
        >
          NOT ANYMORE.
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* 1, the ask ------------------------------------------------------------------ */

/** The Claude spark, turning and breathing while it thinks. */
function Spark({ frame, size }: { frame: number; size: number }) {
  const breathe = 1 + 0.12 * Math.sin(frame / 4);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${frame * 4}deg) scale(${breathe})` }}
    >
      <path d={CLAUDE_SPARK} fill={CLAUDE_ORANGE} />
    </svg>
  );
}

function Ask({ frame }: { frame: number }) {
  const typed = Math.round(
    interpolate(frame, [ASK + TYPE_FROM, ASK + TYPE_TO], [0, PROMPT.length], clamp),
  );
  const thinkAt = ASK + TYPE_TO + 6;
  const think = interpolate(frame, [thinkAt, thinkAt + 8], [0, 1], { ...clamp, easing: pop });
  const out = interpolate(frame, [CODE - 10, CODE], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <StepChip frame={frame} at={ASK} n={1} label="JUST ASK" />
      <div style={{ position: "absolute", top: 470, left: 60, right: 60 }}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 30, color: C.muted }}>
          You
        </div>
        <div
          style={{
            marginTop: 14,
            background: "#16231c",
            border: "2px solid rgba(255,255,255,0.08)",
            borderRadius: 32,
            padding: "34px 38px",
            fontFamily: FONT.sans,
            fontWeight: 600,
            fontSize: 50,
            lineHeight: 1.3,
            color: C.text,
            minHeight: 440,
          }}
        >
          {PROMPT.slice(0, typed)}
          {typed < PROMPT.length && (
            <span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0, color: C.accent }}>▍</span>
          )}
        </div>
        <div
          style={{
            marginTop: 60,
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontFamily: FONT.sans,
            fontWeight: 700,
            fontSize: 40,
            color: C.text,
            opacity: Math.min(think * 1.4, 1),
            transform: `scale(${0.7 + 0.3 * think})`,
            transformOrigin: "left center",
          }}
        >
          <Spark frame={frame} size={72} />
          <span>
            Claude <span style={{ color: C.muted, fontWeight: 600 }}>is writing the chart…</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* 2, the code, as Claude wrote it --------------------------------------------- */

const LINES = codeJson.source.replace(/\n$/, "").split("\n");
/** The lines the reel points at, in reading order, with what each does. */
const CALLOUTS = [
  { match: "fetchMatchEvents(FINAL)", label: "Free StatsBomb data, one call" },
  { match: ".slice(-3)", label: "The last 3 passes before the goal" },
  { match: "<GoalAngle", label: "The goal angle Di María had" },
  { match: "label={label}", label: "Who passed, and when" },
].map((c) => {
  const line = LINES.findIndex((l) => l.includes(c.match));
  if (line < 0) throw new Error(`callout line not found: ${c.match}`);
  return { ...c, line };
});
const STREAM = [CODE + 8, CODE + 64] as const;
const CALL_AT = CALLOUTS.map((_, i) => CODE + 70 + i * 26);
const CALLS_DONE = CODE + 70 + CALLOUTS.length * 26;
/** Lines in the code window, and their height. */
const VISIBLE = 32;
const LINE_H = 24;

function highlight(line: string): ReactNode {
  if (line.trim().startsWith("//")) return <span style={{ color: "#6b8a7a" }}>{line}</span>;
  const parts: ReactNode[] = [];
  const re =
    /("[^"]*")|(<\/?[A-Z][A-Za-z]*)|\b(import|from|const|type|export|default|async|function|await|return)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    const color = m[1] ? "#fbbf77" : m[2] ? "#7dd3fc" : "#f0a3c8";
    parts.push(
      <span key={k++} style={{ color }}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  parts.push(line.slice(last));
  return parts;
}

/** The code window's scroll, in lines: follows the stream, then each callout. */
function scrollAt(frame: number, shown: number) {
  const most = Math.max(0, LINES.length - VISIBLE);
  if (frame < STREAM[1]) return Math.min(most, Math.max(0, shown - VISIBLE));
  const target = (line: number) => Math.min(most, Math.max(0, line - VISIBLE / 2));
  const times = [STREAM[1]];
  const values = [most];
  CALLOUTS.forEach((c, i) => {
    times.push(CALL_AT[i]!, CALL_AT[i]! + 10);
    values.push(values.at(-1)!, target(c.line));
  });
  return interpolate(frame, times, values, { ...clamp, easing: smooth });
}

function Code({ frame }: { frame: number }) {
  const shown = interpolate(frame, [...STREAM], [0, LINES.length], clamp);
  const active = CALL_AT.findIndex(
    (at, i) => frame >= at && frame < (CALL_AT[i + 1] ?? CALLS_DONE),
  );
  const allDone = frame >= CALLS_DONE;
  const scroll = scrollAt(frame, shown);
  const out = interpolate(frame, [DRAW - 10, DRAW], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <StepChip frame={frame} at={CODE} n={2} label="CLAUDE WRITES IT" />
      <div
        style={{
          position: "absolute",
          top: 270,
          left: 28,
          right: 28,
          height: VISIBLE * LINE_H + 44,
          overflow: "hidden",
          background: "#07110c",
          border: "2px solid rgba(52,211,153,0.25)",
          borderRadius: 22,
          fontFamily: FONT.mono,
          fontSize: 17,
          lineHeight: `${LINE_H}px`,
          color: "#d7e5dc",
          whiteSpace: "pre",
        }}
      >
        <div style={{ padding: "22px 20px", transform: `translateY(${-scroll * LINE_H}px)` }}>
          {LINES.map((line, i) => {
            const lit = CALLOUTS.some((c, ci) => c.line === i && (ci === active || allDone));
            return (
              <div
                key={i}
                style={{
                  opacity: i < shown ? (active >= 0 && !lit ? 0.45 : 1) : 0,
                  background: lit ? "rgba(52,211,153,0.18)" : "transparent",
                  borderRadius: 6,
                  margin: "0 -8px",
                  padding: "0 8px",
                }}
              >
                {line === "" ? " " : highlight(line)}
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{ position: "absolute", top: 1150, left: 60, right: 60, display: "grid", gap: 18 }}
      >
        {CALLOUTS.map((c, i) => {
          const t = interpolate(frame, [CALL_AT[i]!, CALL_AT[i]! + 8], [0, 1], {
            ...clamp,
            easing: pop,
          });
          return (
            <div
              key={c.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity: frame >= CALL_AT[i]! ? Math.min(t * 1.4, 1) : 0,
                transform: `translateY(${(1 - t) * 20}px)`,
                fontFamily: FONT.sans,
                fontWeight: 800,
                fontSize: 42,
                color: i === active ? C.accent : C.text,
              }}
            >
              <ChainArrow progress={t} width={44} />
              {c.label}
            </div>
          );
        })}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: FONT.mono,
            fontSize: 24,
            color: C.muted,
            opacity: interpolate(frame, [CALLS_DONE, CALLS_DONE + 8], [0, 1], clamp),
          }}
        >
          <Mark size={26} /> PitchKit&apos;s agent skill teaches Claude the library
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* 3, what it draws ------------------------------------------------------------ */

/** A drawn arrow in the accent green: the shaft, then a chevron head. */
function ChainArrow({ progress: p, width }: { progress: number; width: number }) {
  const shaft = width - 6;
  const head = interpolate(p, [0.6, 1], [0, 1], clamp);
  return (
    <svg width={width} height={28} viewBox={`0 0 ${width} 28`} style={{ flex: "none" }}>
      <line
        x1={3}
        y1={14}
        x2={3 + (shaft - 3) * p}
        y2={14}
        stroke={C.accent}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <polyline
        points={`${shaft - 9},5 ${shaft},14 ${shaft - 9},23`}
        fill="none"
        stroke={C.accent}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={head}
      />
    </svg>
  );
}

function Draw({ frame, node }: { frame: number; node: ReactNode }) {
  const t = frame - DRAW;
  const p = progress(t);
  // Between the shooter and the goal, close in.
  const shotView = { x: (SHOT.from[0]! + 121) / 2, y: (SHOT.from[1]! + 40) / 2, zoom: 1.8 };
  const camera = track(t, [
    [0, { ...mid(MOVES[0]!, 1.5), x: MOVES[0]!.from[0]! }],
    [PASS_AT[0]! + 8, mid(MOVES[0]!, 1.5)],
    // Held left enough to keep Messi's label in shot.
    [PASS_AT[1]! + 12, { ...mid(MOVES[1]!, 1.15), x: 73 }],
    [PASS_AT[2]! + 12, mid(MOVES[2]!, 1.45)],
    [SHOT_AT + 8, shotView],
    [SHOT_AT + 34, shotView],
    // Then back out to the whole move.
    [SHOT_AT + 64, { x: 79, y: 40, zoom: 1.0 }],
  ]);
  // Each name lands when the ball reaches him; Messi's with his pass.
  const nameIn = [PASS_AT[0]! - 2, ...RECEIVED].map((at) =>
    interpolate(t, [at, at + 7], [0, 1], { ...clamp, easing: pop }),
  );
  const out = interpolate(frame, [CTA - 10, CTA], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <StepChip frame={frame} at={DRAW} n={3} label="YOU GET THIS" />
      <Output node={node} width={940} height={840} top={330} camera={camera} css={drawCss(p)} />
      <div
        style={{
          position: "absolute",
          top: 1240,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          whiteSpace: "nowrap",
        }}
      >
        {PASSERS.map((name, i) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {i > 0 && <ChainArrow progress={p.passes[i - 1]!} width={50} />}
            <span
              style={{
                ...big(48, i === 3 && t >= SHOT_AT ? C.accent : C.text),
                opacity: Math.min(nameIn[i]! * 1.5, 1),
                transform: `scale(${0.6 + 0.4 * nameIn[i]!})`,
                display: "inline-block",
              }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

/* Payoff ------------------------------------------------------------------------ */

function Cta({ frame }: { frame: number }) {
  const { fps } = useVideoConfig();
  const line = (i: number) => {
    const t = spring({ frame: frame - CTA - 3 - i * 6, fps, config: { damping: 12, mass: 0.6 } });
    return { opacity: Math.min(t * 1.5, 1), transform: `translateY(${(1 - t) * 50}px)` };
  };
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 70px 140px" }}>
      <div style={{ ...big(150), ...line(0) }}>YOU DON&apos;T</div>
      <div style={{ ...big(150), ...line(1) }}>WRITE THE CODE.</div>
      <div style={{ ...big(150, C.accent), ...line(2) }}>JUST ASK.</div>
      <div
        style={{
          ...line(3),
          marginTop: 50,
          fontFamily: FONT.mono,
          fontSize: 30,
          color: C.text,
          background: "#07110c",
          border: "2px solid rgba(52,211,153,0.3)",
          borderRadius: 16,
          padding: "18px 24px",
        }}
      >
        npx @pitchkit/react skills install
      </div>
      <div
        style={{
          ...line(4),
          marginTop: 30,
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 44,
        }}
      >
        Save this. Then try it ↓
      </div>
    </AbsoluteFill>
  );
}

/* Sound ------------------------------------------------------------------------ */

function cues() {
  const c: { at: number; name: string; volume: number; length: number }[] = [];
  const add = (at: number, name: string, volume: number, length: number) =>
    c.push({ at, name, volume, length });
  // The hook: the pen stroke, the thump as "coders" is struck out, the flip.
  add(STRIKE[0] - 1, "swipe", 0.7, 7);
  add(STRIKE[1], "thump", 1, 15);
  add(FLIP - 2, "whoosh", 0.35, 18);
  add(FLIP + 2, "thud", 0.75, 27);
  add(ASK, "whoosh", 0.4, 18);
  // A soft tick per word typed.
  const words = PROMPT.split(" ");
  let chars = 0;
  for (const word of words) {
    const at = ASK + TYPE_FROM + (chars / PROMPT.length) * (TYPE_TO - TYPE_FROM);
    add(Math.round(at), "tick", 0.25, 3);
    chars += word.length + 1;
  }
  add(ASK + TYPE_TO + 6, "pop", 0.4, 14);
  add(CODE, "whoosh", 0.4, 18);
  for (const at of CALL_AT) add(at, "pop", 0.55, 14);
  add(DRAW, "whoosh", 0.4, 18);
  for (const at of PASS_AT) add(DRAW + at, "swipe", 0.45, 7);
  for (const at of RECEIVED) add(DRAW + at, "tick", 0.6, 3);
  add(DRAW + SHOT_AT, "swipe", 0.6, 7);
  add(DRAW + SHOT_AT + SHOT_LEN, "pop", 1, 14);
  add(CTA, "whoosh", 0.5, 18);
  for (let i = 0; i < 4; i++) add(CTA + 3 + i * 6, "tick", 0.6, 3);
  add(END_AT, "whoosh", 0.5, 18);
  return c;
}

/* Reel ------------------------------------------------------------------------- */

export function ClaudeReel() {
  const frame = useCurrentFrame();
  const node = useClaudeOutput();
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 45%, #0d3b22 0%, #000 70%)",
        fontFamily: FONT.sans,
        color: C.text,
      }}
    >
      {cues().map(({ at, name, volume, length }, i) => (
        <Sequence key={i} from={at} durationInFrames={length} layout="none">
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
        </Sequence>
      ))}
      {frame < ASK && <Hook frame={frame} node={node} />}
      {frame >= ASK && frame < CODE && <Ask frame={frame} />}
      {frame >= CODE && frame < DRAW && <Code frame={frame} />}
      {frame >= DRAW && frame < CTA && <Draw frame={frame} node={node} />}
      {frame >= CTA && frame < END_AT && <Cta frame={frame} />}
      <Sequence from={END_AT} durationInFrames={CLAUDE_DURATION - END_AT}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
}
