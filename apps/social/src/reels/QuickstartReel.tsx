/**
 * Reel 01 — "Palmer's equaliser, rebuilt in 4 steps".
 *
 * Mirrors the docs Quickstart (apps/docs/components/examples/quickstart-chain-basic.tsx):
 * load a match by id, draw a pitch, isolate the possession behind England's
 * goal in the Euro 2024 final, mark the goal. Payoff first, then the build.
 */
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GoalChainChart } from "../charts";
import { Backdrop, Eyebrow } from "../components/Chrome";
import { Code } from "../components/Code";
import { EndCard } from "../components/EndCard";
import { Lockup } from "../components/Logo";
import { finalMeta, palmerGoal, surname } from "../data";
import { C, FONT } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const STEPS = [
  {
    title: "Load the match",
    from: 75,
    to: 165,
    code: `import { fetchMatchEvents }
  from "@pitchkit/data-providers/statsbomb";

const events = await fetchMatchEvents(${finalMeta.matchId});`,
  },
  {
    title: "Draw the pitch",
    from: 165,
    to: 240,
    code: `import { Pitch } from "@pitchkit/react";

<Pitch type="statsbomb">
  {/* layers go here */}
</Pitch>`,
  },
  {
    title: "Isolate the move",
    from: 240,
    to: 480,
    code: `const goal = shots(events).filter(isGoal)
  .find((s) => s.team.name === "England");
const move = events.filter(
  (e) => e.possession === goal.possession);

<Arrows data={move.filter(isPass)} ... />
<Comet data={move.filter(isCarry)} ... />`,
  },
  {
    title: "Mark the goal",
    from: 480,
    to: 570,
    code: `<Scatter data={[goal]} x={(g) => g.x}
  y={(g) => g.y} r={6} fill="var(--pitch-marker-goal)" />
<Annotate data={[goal]} x={(g) => g.x}
  y={(g) => g.y} label={(g) => xgLabel(g)} />`,
  },
] as const;

export const QUICKSTART_DURATION = 660;
const MOVE_FRAMES = 32;
const PITCH_TOP = 870;

function Hook() {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [58, 75], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div
        style={{
          position: "absolute",
          top: 260,
          left: 60,
          right: 100,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <Eyebrow>Euro 2024 final · {palmerGoal.minute + 1}'</Eyebrow>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
          Palmer's
          <br />
          <span style={{ color: C.orange }}>equaliser.</span>
        </div>
        <div style={{ fontSize: 42, color: C.muted, fontWeight: 600, lineHeight: 1.25 }}>
          Rebuilt from a match ID
          <br />
          in 4 steps.
        </div>
      </div>
    </AbsoluteFill>
  );
}

function StepHeader({ index, title }: { index: number; title: string }) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        left: 60,
        right: 100,
        opacity: enter,
        transform: `translateX(${(1 - enter) * -30}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <Eyebrow>Step {String(index + 1).padStart(2, "0")} / 04</Eyebrow>
      <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: "-0.035em" }}>{title}</div>
    </div>
  );
}

function StepCode({ code, extra }: { code: string; extra?: ReactNode }) {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [4, 4 + code.length * 0.3], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", top: 430, left: 60, right: 60 }}>
      <Code code={code} size={25} reveal={reveal} cursor={reveal < 1} title="Equaliser.tsx" />
      {extra}
    </div>
  );
}

/** "→ 3,977 events" counting up under step 1's code. */
function EventCounter() {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [42, 72], [0, finalMeta.eventCount], clamp));
  return (
    <div
      style={{
        marginTop: 36,
        fontFamily: FONT.mono,
        fontSize: 56,
        fontWeight: 600,
        color: C.accent,
        opacity: interpolate(frame, [38, 44], [0, 1], clamp),
      }}
    >
      → {n.toLocaleString("en-GB")} events
    </div>
  );
}

/** The chain of players, revealed move by move during step 3. */
function Ticker({ upTo }: { upTo: number }) {
  const names: string[] = [];
  for (const move of palmerGoal.moves.slice(0, Math.max(0, Math.ceil(upTo)))) {
    const name = surname(move.player);
    if (names.at(-1) !== name) names.push(name);
  }
  if (upTo >= palmerGoal.moves.length + 0.5) names.push(surname(palmerGoal.scorer));
  return (
    <div
      style={{
        position: "absolute",
        bottom: 1920 - PITCH_TOP + 18,
        left: 60,
        right: 60,
        fontSize: 30,
        lineHeight: 1.3,
        fontWeight: 600,
        color: C.muted,
      }}
    >
      {names.map((name, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: C.faint }}> → </span>}
          <span style={{ color: i === names.length - 1 ? C.text : C.muted }}>{name}</span>
        </span>
      ))}
    </div>
  );
}

export function QuickstartReel() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pitch: fully built during the hook, gone for step 1, drawn in at step 2.
  const hook = frame < 75;
  const pitchIn = hook
    ? interpolate(frame, [58, 75], [1, 0], clamp)
    : spring({ frame: frame - STEPS[1].from, fps, config: { damping: 18 } });

  // How much of the move is drawn: one unit per pass/carry, then the shot.
  const moves = palmerGoal.moves.length;
  const moveProgress = Math.max(0, (frame - STEPS[2].from - 12) / MOVE_FRAMES);
  const progress = hook
    ? Infinity
    : frame < STEPS[3].from
      ? Math.min(moveProgress, moves - 0.001)
      : moves + interpolate(frame, [STEPS[3].from + 12, STEPS[3].from + 26], [0, 1], clamp);
  const goalPop = hook
    ? 1
    : frame < STEPS[3].from + 20
      ? 0
      : spring({ frame: frame - STEPS[3].from - 20, fps, config: { damping: 9 } });

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans, color: C.text }}>
      <Backdrop />
      <div style={{ position: "absolute", top: 110, left: 60 }}>
        <Lockup size={46} />
      </div>

      <div
        style={{
          position: "absolute",
          top: PITCH_TOP,
          left: 60,
          opacity: pitchIn,
          transform: `scale(${0.94 + pitchIn * 0.06})`,
          transformOrigin: "50% 50%",
        }}
      >
        <GoalChainChart chain={palmerGoal} width={960} progress={progress} goalPop={goalPop} />
      </div>

      <Sequence durationInFrames={75}>
        <Hook />
      </Sequence>

      {STEPS.map((step, i) => (
        <Sequence key={step.title} from={step.from} durationInFrames={step.to - step.from}>
          <StepHeader index={i} title={step.title} />
          <StepCode code={step.code} extra={i === 0 ? <EventCounter /> : undefined} />
        </Sequence>
      ))}

      <Sequence from={STEPS[2].from} durationInFrames={STEPS[3].to - STEPS[2].from}>
        <Ticker upTo={frame < STEPS[3].from ? moveProgress : moves + 1} />
      </Sequence>

      <Sequence from={570}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
}
