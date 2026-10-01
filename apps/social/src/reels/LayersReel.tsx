/**
 * Reel 03 — "11 layers. One pitch." A rapid-fire montage: one PitchKit layer
 * per beat, each drawing a real finding from the Euro 2024 final (see
 * layer-beats.tsx for the data behind every beat). Cut on a ~1.4 s beat so it
 * lands on whatever trending audio it's posted with.
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
import { Backdrop, Eyebrow } from "../components/Chrome";
import { EndCard } from "../components/EndCard";
import { Lockup } from "../components/Logo";
import { C, FONT } from "../theme";
import { BEATS, BeatPitch } from "./layer-beats";
import type { Beat } from "./layer-beats";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const HOOK = 50;
const BEAT = 42; // 1.4 s at 30 fps
const FADE = 6;
const BEATS_END = HOOK + BEATS.length * BEAT;
export const LAYERS_DURATION = BEATS_END + 90;

const PITCH_WIDTH = 600;
const PITCH_TOP = 560;

/** Fades a beat in over FADE frames and holds; the next beat covers it. */
function BeatFrame({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [0, FADE], [0, 1], clamp) }}>
      {children}
    </AbsoluteFill>
  );
}

/** `<Layer>` over a four-or-five-word headline, then the stat chip. */
function BeatHeader({ beat }: { beat: Beat }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = interpolate(frame, [0, 8], [0.92, 1], clamp);
  const chipPop = spring({ frame: frame - 5, fps, config: { damping: 12, mass: 0.5 } });
  return (
    <>
      <div style={{ position: "absolute", top: 232, left: 60, right: 60 }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 68,
            fontWeight: 600,
            color: C.accent,
            letterSpacing: "-0.03em",
            transform: `scale(${pop})`,
            transformOrigin: "0 50%",
          }}
        >
          &lt;{beat.layer}&gt;
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 58,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
          }}
        >
          {beat.headline}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 432,
          left: 60,
          display: "flex",
          alignItems: "baseline",
          gap: 20,
          padding: beat.compact ? "12px 24px 14px" : "14px 28px 16px",
          borderRadius: 22,
          background: "rgba(52, 211, 153, 0.12)",
          border: `1.5px solid ${C.border}`,
          opacity: chipPop,
          transform: `scale(${0.85 + 0.15 * chipPop})`,
          transformOrigin: "0 50%",
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: beat.compact ? 44 : 56,
            fontWeight: 700,
            color: C.accent,
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
          }}
        >
          {beat.chip.big}
        </span>
        <span
          style={{
            fontSize: beat.compact ? 24 : 28,
            fontWeight: 600,
            color: C.muted,
            whiteSpace: "nowrap",
          }}
        >
          {beat.chip.label}
        </span>
      </div>
      {beat.legend && (
        <div
          style={{
            position: "absolute",
            top: 456,
            right: 60,
            display: "flex",
            gap: 24,
            fontSize: 28,
            fontWeight: 600,
            color: C.muted,
          }}
        >
          {beat.legend.map((item) => (
            <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{ width: 20, height: 20, borderRadius: "50%", background: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function Hook() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [HOOK - 8, HOOK], [1, 0], clamp) }}>
      <div
        style={{
          position: "absolute",
          top: 560,
          left: 60,
          right: 100,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <Eyebrow>One match · every layer</Eyebrow>
        <div
          style={{ fontSize: 120, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.98 }}
        >
          {BEATS.length} layers.
          <br />
          One{" "}
          <span style={{ fontFamily: FONT.mono, color: C.accent, letterSpacing: "-0.06em" }}>
            &lt;Pitch&gt;
          </span>
          .
        </div>
        <div style={{ fontSize: 40, color: C.muted, fontWeight: 600 }}>
          Spain 2–1 England · Euro 2024 final
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function LayersReel() {
  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans, color: C.text }}>
      <Backdrop />

      <Sequence durationInFrames={HOOK}>
        <Hook />
      </Sequence>

      {BEATS.map((beat, i) => (
        <Sequence key={beat.layer} from={HOOK + i * BEAT} durationInFrames={BEAT + FADE}>
          <BeatFrame>
            <Backdrop />
            <BeatHeader beat={beat} />
            <div
              style={{
                position: "absolute",
                top: PITCH_TOP,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <BeatPitch beat={beat} width={beat.width ?? PITCH_WIDTH} />
            </div>
          </BeatFrame>
        </Sequence>
      ))}

      {/* Above the beats, each of which paints its own backdrop. */}
      <Sequence durationInFrames={BEATS_END + FADE}>
        <div style={{ position: "absolute", top: 110, left: 60 }}>
          <Lockup size={46} />
        </div>
      </Sequence>

      <Sequence from={BEATS_END}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
}
