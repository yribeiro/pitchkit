import type { PitchDimensions } from "../dimensions/types.js";
import { displayUnitScale } from "../transform/canonical.js";
import type { Line, Rect } from "./geometry.js";
import type { PitchStripes } from "./types.js";

const DEFAULT_STRIPE_COUNT = 12;

/** `true` -> a sensible default band count; a number -> that count (floored, min 0). */
export function resolveStripeCount(stripes: PitchStripes | undefined): number {
  if (!stripes) return 0;
  if (stripes === true) return DEFAULT_STRIPE_COUNT;
  return Math.max(0, Math.floor(stripes));
}

/**
 * Computes the alternating vertical grass stripe bands across the outline
 * (every other band is painted — the gaps are the "unpainted" stripes,
 * left to show the surface color underneath). Pure geometry, no rendering.
 */
export function computeStripeBands(outline: Rect, stripeCount: number): Rect[] {
  if (stripeCount < 2) return [];
  const bandWidth = outline.width / stripeCount;
  const bands: Rect[] = [];
  for (let i = 0; i < stripeCount; i += 2) {
    bands.push({
      x: outline.x + i * bandWidth,
      y: outline.y,
      width: bandWidth,
      height: outline.height,
    });
  }
  return bands;
}

/**
 * The goal-box visual depth: a scaled-off approximation (a multiple of the
 * corner-arc radius, itself a small provider-unit constant), not a
 * regulation goal-depth figure, since this is a styling flourish, not a
 * measured mark.
 */
export function goalBoxDepth(cornerArcRadius: number): number {
  return cornerArcRadius * 3;
}

/**
 * {@link goalBoxDepth} for a given pitch, in its own x units.
 *
 * The corner-arc radius is in metres on every grid, so on a percentage grid
 * the depth has to be converted before it is drawn alongside x coordinates.
 * On Metrica's `0..1` grid the unconverted value is three pitch lengths.
 */
export function pitchGoalBoxDepth(dimensions: PitchDimensions): number {
  return goalBoxDepth(dimensions.markings.cornerArcRadius) / displayUnitScale(dimensions)[0];
}

/** Computes the goal-box Rect for one goal line. `isLeft` = the pitch's near/left goal. */
export function computeGoalBox(goal: Line, isLeft: boolean, depth: number): Rect {
  const lineX = goal.from[0];
  const x = isLeft ? lineX - depth : lineX;
  const y = Math.min(goal.from[1], goal.to[1]);
  const height = Math.abs(goal.to[1] - goal.from[1]);
  return { x, y, width: depth, height };
}
