/**
 * Shared pieces for the corner-kick carousel: the emerald label block, the
 * block-letter headline, the data credit, and an upright corner pitch.
 */
import type { ReactNode } from "react";
import { Pitch } from "@pitchkit/react";
import { AbsoluteFill } from "remotion";
import { Upright } from "../charts";
import { PitchStage } from "../components/Chrome";
import { cornersData } from "../data";
import type { Corner } from "../data";
import { appearance, C, FONT } from "../theme";

export const DISPLAY = "Anton, Impact, sans-serif";
export const CREDIT = "SkillCorner open data · Auckland FC v Newcastle Jets";

export function Slide({
  label,
  title,
  children,
  credit = true,
}: {
  label: string;
  title: ReactNode;
  children: ReactNode;
  credit?: boolean;
}) {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT.sans, color: C.text }}>
      <div style={{ position: "absolute", top: 88, left: 64, right: 64 }}>
        <div
          style={{
            display: "inline-block",
            background: C.accent,
            color: "#000",
            fontFamily: DISPLAY,
            fontSize: 100,
            lineHeight: 1,
            padding: "12px 26px 4px",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: DISPLAY,
            fontSize: 150,
            lineHeight: 0.98,
            letterSpacing: "0.005em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
      </div>
      {children}
      {credit && (
        <div
          style={{
            position: "absolute",
            left: 64,
            right: 64,
            bottom: 44,
            fontFamily: FONT.mono,
            fontSize: 22,
            color: C.faint,
          }}
        >
          {CREDIT}
        </div>
      )}
    </AbsoluteFill>
  );
}

/** A big number and what it counts. */
export function Chip({ big, label }: { big: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
      <span
        style={{
          fontFamily: DISPLAY,
          fontSize: 120,
          lineHeight: 1,
          color: C.accent,
          letterSpacing: "0.01em",
        }}
      >
        {big}
      </span>
      <span style={{ fontSize: 38, fontWeight: 700, color: C.muted, lineHeight: 1.15 }}>
        {label}
      </span>
    </div>
  );
}

export interface Crop {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * The attacking end drawn upright (goal at the top, attacker's left on the
 * left): a horizontal SkillCorner pitch turned -90°. The screen width runs
 * along the pitch's y axis and the height along x, so a crop that is wide in y
 * and short in x fills a phone slide.
 */
export function CornerPitch({
  crop,
  width,
  children,
}: {
  crop: Crop;
  width: number;
  children: ReactNode;
}) {
  const pad = 4;
  const k = (width - pad * 2) / (crop.y1 - crop.y0);
  const height = (crop.x1 - crop.x0) * k + pad * 2;
  return (
    <PitchStage>
      <Upright width={width} height={height}>
        <Pitch
          type="skillcorner"
          dimensions={{ length: cornersData.pitchLength, width: cornersData.pitchWidth }}
          width={height}
          height={width}
          padding={{ top: pad, right: pad, bottom: pad, left: pad }}
          crop={crop}
          appearance={appearance}
        >
          {children}
        </Pitch>
      </Upright>
    </PitchStage>
  );
}

export const cornerAt = (minute: number): Corner => {
  const c = cornersData.corners.find((x) => x.minute === minute);
  if (!c) throw new Error(`No corner at ${minute}'`);
  return c;
};

export const frameAt = (corner: Corner, rel: number) =>
  corner.frames.find((f) => f.frame >= rel) ?? corner.frames.at(-1)!;

/** One player's `[x, y]` for every frame from `from` to `to` (relative to the kick). */
export function track(corner: Corner, playerId: number, from: number, to: number) {
  const pts: [number, number][] = [];
  for (const f of corner.frames) {
    if (f.frame < from || f.frame > to) continue;
    const p = f.players.find((q) => q[0] === playerId);
    if (p) pts.push([p[1], p[2]]);
  }
  return pts;
}

/** Consecutive points as `{from, to}` segments, for `<Comet>`. */
export const segments = (pts: [number, number][]) =>
  pts.slice(1).map((to, i) => ({ from: pts[i]!, to }));
