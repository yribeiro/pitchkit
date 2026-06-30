import type { PitchDimensions } from "../dimensions/types.js";
import type { Viewport } from "../transform/types.js";

/**
 * No layer variants exist yet in M0 — Milestone 1 introduces the
 * discriminated union (Scatter, Arrows, Heatmap, ...). The renderer's
 * layer-walk is a deliberate no-op over an empty array until then.
 */
export type Layer = never;

/**
 * A Scene is the renderer-independent description of one pitch render:
 * which provider coordinate system, how it's displayed, and what's drawn
 * on it (PRD §8.3). Pure data — layers don't own DOM.
 */
export interface Scene {
  readonly dimensions: PitchDimensions;
  readonly viewport: Viewport;
  readonly layers: readonly Layer[];
}
