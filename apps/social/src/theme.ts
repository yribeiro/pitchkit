import type { CSSProperties } from "react";
import type { PitchAppearance } from "@pitchkit/core";

/** Instagram's feed portrait (4:5) — also what X shows uncropped on mobile. */
export const POST = { width: 1080, height: 1350 } as const;
/** Reels / Stories / Shorts (9:16). */
export const REEL = { width: 1080, height: 1920, fps: 30 } as const;

/**
 * Reel safe area. Instagram overlays the caption, audio chip and action rail
 * on the bottom ~20% and right edge, and the header on the top ~12%; nothing
 * that has to be read goes outside this box.
 */
export const REEL_SAFE = { top: 250, bottom: 1500, left: 60, right: 960 } as const;

/** Brand palette — the emerald of the PitchKit mark, on flat black. */
export const C = {
  bg: "#000000",
  bgRaised: "#0b1a13",
  panel: "#0e1f17",
  border: "rgba(52, 211, 153, 0.18)",
  emerald: "#34d399",
  /** Emerald for text sitting directly on `bg`. */
  accent: "#34d399",
  emeraldDeep: "#10b981",
  text: "#eef5f1",
  muted: "#8fa89b",
  faint: "#56695f",
  /** The docs site's marker colours (docs-pitch-theme.css). */
  sky: "#38bdf8",
  orange: "#fb923c",
  spain: "#f87171",
  england: "#93c5fd",
} as const;

export const FONT = {
  sans: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

/** The docs site's pitch theme, with markings thickened for a phone screen. */
export const pitchVars = {
  "--pitch-surface": "#0f3d24",
  "--pitch-stripe": "rgba(255, 255, 255, 0.045)",
  "--pitch-lines": "rgba(255, 255, 255, 0.8)",
  "--pitch-line-width": "2.5",
  "--pitch-marker-primary": C.sky,
  "--pitch-marker-goal": C.orange,
} as CSSProperties;

export const appearance: PitchAppearance = { stripes: true, goalType: "box" };
export const densityAppearance: PitchAppearance = { ...appearance, linesOnTop: true };

/**
 * Room for the outer touchline's stroke (otherwise half-clipped) and, along
 * the length, for the box-style goals that sit behind each goal line.
 */
export const PAD = { top: 4, right: 18, bottom: 4, left: 18 } as const;
/** `PAD` for a vertical pitch, where the goals sit top and bottom. */
export const PAD_V = { top: 18, right: 4, bottom: 18, left: 4 } as const;
export const padFor = (orientation: "horizontal" | "vertical" = "horizontal") =>
  orientation === "vertical" ? PAD_V : PAD;
