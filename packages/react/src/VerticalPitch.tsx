import { Pitch } from "./Pitch.js";
import type { PitchProps } from "./Pitch.js";

/**
 * `<Pitch orientation="vertical">`, named to match mplsoccer's
 * `VerticalPitch` for familiarity. Core has no separate vertical pitch
 * concept (orientation is a `Viewport` field, not a distinct coordinate
 * system) — this is purely a naming/ergonomics convenience at the
 * component-API layer.
 */
export function VerticalPitch(props: Omit<PitchProps, "orientation">) {
  return <Pitch {...props} orientation="vertical" />;
}
