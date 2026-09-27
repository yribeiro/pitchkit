/**
 * CSS custom property names the renderer reads for theming (docs/architecture.md#theming-and-styling).
 * This object exists purely for editor autocomplete and typo-safety when
 * consumers set these variables in their own CSS — the values themselves
 * always live in CSS, never here.
 */
export const pitchTokens = {
  surface: "--pitch-surface",
  stripe: "--pitch-stripe",
  lines: "--pitch-lines",
  lineWidth: "--pitch-line-width",
  markerPrimary: "--pitch-marker-primary",
  markerGoal: "--pitch-marker-goal",
  markerMiss: "--pitch-marker-miss",
} as const;
