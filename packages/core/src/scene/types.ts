import type { PitchDimensions } from "../dimensions/types.js";
import type { Viewport } from "../transform/types.js";

/**
 * No layer variants exist yet in M0 — Milestone 1 introduces the
 * discriminated union (Scatter, Arrows, Heatmap, ...). The renderer's
 * layer-walk is a deliberate no-op over an empty array until then.
 */
export type Layer = never;

/** How many vertical grass stripes to paint; `true` picks a sensible default. */
export type PitchStripes = boolean | number;

/** Visual treatment of the goal markings. */
export type GoalType = "line" | "box";

/**
 * Non-coordinate visual treatment of the pitch surface (PRD §8.7's
 * "grass/stripes, line colour/width/alpha, goal types" styling knobs).
 * Deliberately separate from `PitchDimensions` (a fact about the provider's
 * coordinate system) and from CSS variables (the colours themselves) — this
 * only toggles which shapes get painted.
 */
export interface PitchAppearance {
  readonly stripes?: PitchStripes;
  readonly goalType?: GoalType;
}

/**
 * A Scene is the renderer-independent description of one pitch render:
 * which provider coordinate system, how it's displayed, and what's drawn
 * on it (PRD §8.3). Pure data — layers don't own DOM.
 */
export interface Scene {
  readonly dimensions: PitchDimensions;
  readonly viewport: Viewport;
  readonly appearance?: PitchAppearance;
  readonly layers: readonly Layer[];
}
