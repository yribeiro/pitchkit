/**
 * Reel 03 — rapid-fire montage: the same match through every layer
 * component, then the same chart through four palettes. Cut on a ~1.2 s beat
 * so it lands on whatever trending audio it's posted with.
 */
import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { LAYER_DEMOS, LayerDemoChart, PALETTES, PaletteShotMap } from "../charts";
import { Backdrop, Eyebrow } from "../components/Chrome";
import { EndCard } from "../components/EndCard";
import { Lockup } from "../components/Logo";
import { C, FONT } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const HOOK = 50;
const BEAT = 36; // 1.2 s at 30 fps
const FADE = 6;
const PALETTE_BEAT = 27;
const LAYERS_END = HOOK + LAYER_DEMOS.length * BEAT;
const PALETTES_END = LAYERS_END + PALETTES.length * PALETTE_BEAT;
export const LAYERS_DURATION = PALETTES_END + 90;

const PITCH_WIDTH = 680;
const PITCH_TOP = 440;
const PITCH_LEFT = (1080 - PITCH_WIDTH) / 2;

/** Fades a beat in over FADE frames and holds; the next beat covers it. */
function Beat({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [0, FADE], [0, 1], clamp) }}>
      {children}
    </AbsoluteFill>
  );
}

function Title({ name, what, color = C.emerald }: { name: string; what: string; color?: string }) {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 8], [0.92, 1], clamp);
  return (
    <div style={{ position: "absolute", top: 250, left: 60, right: 100 }}>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 76,
          fontWeight: 600,
          color,
          letterSpacing: "-0.03em",
          transform: `scale(${pop})`,
          transformOrigin: "0 50%",
        }}
      >
        &lt;{name}&gt;
      </div>
      <div style={{ marginTop: 8, fontSize: 38, fontWeight: 600, color: C.muted }}>{what}</div>
    </div>
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
          13 layers.
          <br />
          One{" "}
          <span style={{ fontFamily: FONT.mono, color: C.emerald, letterSpacing: "-0.06em" }}>
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

      {LAYER_DEMOS.map((demo, i) => (
        <Sequence key={demo.name} from={HOOK + i * BEAT} durationInFrames={BEAT + FADE}>
          <Beat>
            <Backdrop />
            <Title name={demo.name} what={demo.what} />
            <div style={{ position: "absolute", top: PITCH_TOP, left: PITCH_LEFT }}>
              <LayerDemoChart demo={demo} width={PITCH_WIDTH} orientation="vertical" />
            </div>
          </Beat>
        </Sequence>
      ))}

      {PALETTES.map((palette, i) => (
        <Sequence
          key={palette.name}
          from={LAYERS_END + i * PALETTE_BEAT}
          durationInFrames={PALETTE_BEAT + FADE}
        >
          <Beat>
            <AbsoluteFill style={{ background: palette.card }} />
            <div
              style={{
                position: "absolute",
                top: 110,
                left: 60,
                fontSize: 30,
                fontWeight: 700,
                color: palette.muted,
                fontFamily: FONT.mono,
              }}
            >
              theme {String(i + 1).padStart(2, "0")} / 04
            </div>
            <div style={{ position: "absolute", top: 250, left: 60, right: 100 }}>
              <div
                style={{
                  fontSize: 88,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: palette.text,
                }}
              >
                {palette.name}
              </div>
              <div style={{ marginTop: 8, fontSize: 38, fontWeight: 600, color: palette.muted }}>
                Just CSS variables.
              </div>
            </div>
            <div style={{ position: "absolute", top: PITCH_TOP, left: PITCH_LEFT }}>
              <PaletteShotMap
                palette={palette}
                width={PITCH_WIDTH}
                orientation="vertical"
                scale={1.1}
              />
            </div>
          </Beat>
        </Sequence>
      ))}

      {/* Above the beats (each paints its own backdrop), until the palettes
          take over with their own light/dark cards. */}
      <Sequence durationInFrames={LAYERS_END + FADE}>
        <div style={{ position: "absolute", top: 110, left: 60 }}>
          <Lockup size={46} />
        </div>
      </Sequence>

      <Sequence from={PALETTES_END}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
}
