/**
 * Reel 07: "Football analysis is for coders. Not anymore." In under 30
 * seconds: the hook flips a belief (rule 25), then three value beats show the
 * real thing. 1, the prompt. 2, the component Claude wrote with PitchKit's agent
 * skill (src/reels/claude/DiMariaGoal.tsx, shown as written). 3, what it draws:
 * the reel runs that component, unchanged, on StatsBomb's own events for the
 * match (a trimmed local copy, since the renderer has no network; see
 * scripts/snapshot-claude-demo.mjs). Then the payoff and the setup line.
 */
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pitch } from "@pitchkit/react";
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
import { C, FONT } from "../theme";
import DiMariaGoal from "./claude/DiMariaGoal";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = Easing.out(Easing.back(2.2));

/* Timeline (30 fps) ------------------------------------------------------- */

const ASK = 75;
const CODE = 225;
const DRAW = 435;
const CTA = 660;
const END_AT = 810;
export const CLAUDE_DURATION = END_AT + 75;

const PROMPT =
  "Show me the three passes before Di María's goal in the 2022 World Cup final. Use PitchKit and StatsBomb's free data.";
/** The prompt types in over these frames after ASK. */
const TYPE_FROM = 10;
const TYPE_TO = 105;
const PASSERS = ["MESSI", "ÁLVAREZ", "MAC ALLISTER", "DI MARÍA"];

/* Running Claude's component ------------------------------------------------ */

/**
 * Calls the component Claude wrote and returns what it rendered. Its one
 * network call, StatsBomb's events file, is answered from the local copy.
 */
function useClaudeOutput() {
  const [node, setNode] = useState<ReactNode>(null);
  const [handle] = useState(() => delayRender("Running Claude's component"));
  useEffect(() => {
    const real = window.fetch;
    window.fetch = async (input, init) => {
      if (String(input).endsWith("/events/3869685.json")) {
        return new Response(JSON.stringify(rawEvents), {
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

/**
 * Claude's output, turned so the goal is at the top, in a viewport the camera
 * can push into. `reveal` (0..1) wipes the marks in from the halfway line
 * towards goal over a plain pitch, so the drawing appears move by move without
 * changing the component; `zoom` pushes in on the goal end.
 */
function Output({
  node,
  width,
  height,
  top,
  reveal,
  zoom,
}: {
  node: ReactNode;
  width: number;
  height: number;
  top: number;
  reveal: number;
  zoom: number;
}) {
  const long = width * 1.5;
  const box: CSSProperties = { position: "absolute", left: 0, top: 0, width: long, height: width };
  // 0.42 is about where the build-up starts (Messi, just inside France's half).
  const shown = 0.42 + 0.58 * reveal;
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - width) / 2,
        top,
        width,
        height,
        overflow: "hidden",
        borderRadius: 20,
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height: long,
          // Anchored at the goal line, with a little grass above it, and at
          // Argentina's right flank (85% across), so the whole move stays in
          // frame as the camera pushes in.
          transformOrigin: "85% 0%",
          transform: `translateY(${36 * zoom}px) scale(${zoom})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: long,
            width: long,
            height: width,
            transformOrigin: "0 0",
            transform: "rotate(-90deg)",
          }}
        >
          <div style={box}>
            <Pitch type="statsbomb" />
          </div>
          <div style={{ ...box, clipPath: `inset(0 ${(1 - shown) * 100}% 0 0)` }}>{node}</div>
        </div>
      </div>
    </div>
  );
}

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

function Hook({ frame, node }: { frame: number; node: ReactNode }) {
  const strike = interpolate(frame, [14, 26], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const flip = interpolate(frame, [28, 38], [0, 1], { ...clamp, easing: pop });
  const out = interpolate(frame, [ASK - 10, ASK], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Output
        node={node}
        width={900}
        height={1180}
        top={600}
        reveal={interpolate(frame, [0, 36], [0.6, 1], {
          ...clamp,
          easing: Easing.out(Easing.quad),
        })}
        zoom={interpolate(frame, [0, ASK], [1.35, 1.7], clamp)}
      />
      <div style={{ position: "absolute", top: 120, left: 60, right: 60 }}>
        <div style={big(104)}>FOOTBALL ANALYSIS</div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={big(104)}>IS FOR CODERS.</div>
          <div
            style={{
              position: "absolute",
              left: -8,
              top: "48%",
              height: 14,
              width: `calc(${strike * 100}% + 16px)`,
              opacity: strike > 0 ? 1 : 0,
              background: "#ef4444",
              borderRadius: 7,
              transform: "rotate(-3deg)",
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

function Ask({ frame }: { frame: number }) {
  const typed = Math.round(
    interpolate(frame, [ASK + TYPE_FROM, ASK + TYPE_TO], [0, PROMPT.length], clamp),
  );
  const thinking = frame > ASK + TYPE_TO + 8;
  const out = interpolate(frame, [CODE - 10, CODE], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <StepChip frame={frame} at={ASK} n={1} label="JUST ASK" />
      <div style={{ position: "absolute", top: 520, left: 60, right: 60 }}>
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
            fontSize: 52,
            lineHeight: 1.3,
            color: C.text,
            minHeight: 420,
          }}
        >
          {PROMPT.slice(0, typed)}
          {typed < PROMPT.length && (
            <span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0, color: C.accent }}>▍</span>
          )}
        </div>
        {thinking && (
          <div
            style={{
              marginTop: 60,
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontFamily: FONT.sans,
              fontWeight: 700,
              fontSize: 34,
              color: C.text,
            }}
          >
            Claude
            <span style={{ display: "flex", gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: C.accent,
                    opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame - i * 4) / 4)),
                  }}
                />
              ))}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}

/* Code, as Claude wrote it --------------------------------------------------- */

const LINES = codeJson.source.replace(/\n$/, "").split("\n");
/** The three lines the reel points at, with what each does. */
const CALLOUTS = [
  { match: "fetchMatchEvents(FINAL)", label: "Free StatsBomb data, one call" },
  { match: ".slice(-3)", label: "The last 3 passes before the goal" },
  { match: "<GoalAngle", label: "The goal angle Di María had" },
].map((c) => ({ ...c, line: LINES.findIndex((l) => l.includes(c.match)) }));

function highlight(line: string): ReactNode {
  if (line.trim().startsWith("//")) return <span style={{ color: "#6b8a7a" }}>{line}</span>;
  const parts: ReactNode[] = [];
  const re =
    /("[^"]*")|(<\/?[A-Z][A-Za-z]*)|\b(import|from|const|export|default|async|function|await|return)\b/g;
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

function Code({ frame }: { frame: number }) {
  const shown = interpolate(frame, [CODE + 8, CODE + 70], [0, LINES.length], clamp);
  const active = CALLOUTS.findIndex(
    (_, i) => frame >= CODE + 80 + i * 40 && frame < CODE + 80 + (i + 1) * 40,
  );
  const allDone = frame >= CODE + 80 + CALLOUTS.length * 40;
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
          background: "#07110c",
          border: "2px solid rgba(52,211,153,0.25)",
          borderRadius: 22,
          padding: "22px 20px",
          fontFamily: FONT.mono,
          fontSize: 17,
          lineHeight: "24px",
          color: "#d7e5dc",
          whiteSpace: "pre",
        }}
      >
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
              {highlight(line) || " "}
            </div>
          );
        })}
      </div>
      <div
        style={{ position: "absolute", top: 1360, left: 60, right: 60, display: "grid", gap: 22 }}
      >
        {CALLOUTS.map((c, i) => {
          const on = frame >= CODE + 80 + i * 40;
          const t = interpolate(frame, [CODE + 80 + i * 40, CODE + 88 + i * 40], [0, 1], {
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
                opacity: on ? Math.min(t * 1.4, 1) : 0,
                transform: `translateY(${(1 - t) * 20}px)`,
                fontFamily: FONT.sans,
                fontWeight: 800,
                fontSize: 42,
                color: i === active ? C.accent : C.text,
              }}
            >
              <span style={{ ...big(44, C.accent) }}>→</span>
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
            opacity: allDone ? 1 : 0,
          }}
        >
          <Mark size={26} /> PitchKit&apos;s agent skill teaches Claude the library
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* What it draws -------------------------------------------------------------- */

function Draw({ frame, node }: { frame: number; node: ReactNode }) {
  const local = frame - DRAW;
  // One pass per beat, then the shot.
  const reveal = interpolate(local, [14, 44, 74, 104, 140], [0, 0.18, 0.42, 0.7, 1], clamp);
  const named = Math.min(4, Math.floor(interpolate(local, [14, 44, 74, 104], [1, 2, 3, 4], clamp)));
  const out = interpolate(frame, [CTA - 10, CTA], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <StepChip frame={frame} at={DRAW} n={3} label="YOU GET THIS" />
      <Output
        node={node}
        width={940}
        height={1280}
        top={290}
        reveal={reveal}
        zoom={interpolate(local, [0, 104, 150], [1.1, 1.42, 1.52], {
          ...clamp,
          easing: Easing.inOut(Easing.sin),
        })}
      />
      <div
        style={{
          position: "absolute",
          top: 1640,
          left: 20,
          right: 20,
          textAlign: "center",
          whiteSpace: "nowrap",
          ...big(50),
        }}
      >
        {PASSERS.slice(0, named).map((name, i) => (
          <span key={name} style={{ color: i === 3 && local >= 104 ? C.accent : C.text }}>
            {i > 0 && <span style={{ color: C.muted }}> → </span>}
            {name}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}

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
  add(26, "whoosh", 0.4, 18);
  add(30, "thud", 0.9, 27);
  add(ASK, "whoosh", 0.4, 18);
  // A soft tick per word typed.
  const words = PROMPT.split(" ");
  let chars = 0;
  for (const word of words) {
    add(
      Math.round(ASK + TYPE_FROM + (chars / PROMPT.length) * (TYPE_TO - TYPE_FROM)),
      "tick",
      0.25,
      3,
    );
    chars += word.length + 1;
  }
  add(CODE, "whoosh", 0.4, 18);
  for (let i = 0; i < CALLOUTS.length; i++) add(CODE + 80 + i * 40, "pop", 0.55, 14);
  add(DRAW, "whoosh", 0.4, 18);
  for (const at of [14, 44, 74]) add(DRAW + at, "tick", 0.5, 3);
  add(DRAW + 120, "pop", 1, 14);
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
