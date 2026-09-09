import type { PitchAppearance } from "@pitchkit/core";

/**
 * One deliberate appearance shared by every live example on the docs site,
 * so pitches read as an intentional, on-brand look rather than the
 * library's bare defaults. Colours themselves come from the `--pitch-*`
 * CSS variables set in `docs-pitch-theme.css` (PitchKit's theming model is
 * CSS-variable-only, per CLAUDE.md) — this only toggles which shapes get
 * painted (stripes, goal style).
 */
export const docsAppearance: PitchAppearance = {
  stripes: true,
  goalType: "box",
};

/**
 * The density-layer variant: identical, but with the markings painted
 * above the layers (mplsoccer's `line_zorder`). An opaque heatmap /
 * hexbin / KDE fill would otherwise cover the lines it sits on.
 */
export const docsDensityAppearance: PitchAppearance = {
  ...docsAppearance,
  linesOnTop: true,
};
