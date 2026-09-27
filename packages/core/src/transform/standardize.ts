import type { PitchDimensions } from "../dimensions/types.js";
import { fromUnitSquare, toUnitSquare } from "./canonical.js";
import type { Point } from "./types.js";

/**
 * Pure provider-to-provider coordinate conversion, based on each pitch's
 * relative position along its length/width axes. This is the math
 * underlying the public `Standardizer` API (docs/roadmap.md#pitch-drawing-and-geometry) —
 * M0 ships only this pure function, not a stateful public class.
 *
 * This is a simplified uniform-extent standardizer. mplsoccer's own
 * Standardizer instead interpolates between pitch markings (six-yard line,
 * penalty line, etc.) as piecewise control points, which keeps markings
 * aligned across providers whose box-to-pitch-size ratios differ slightly.
 * A uniform mapping is exact for extent-only landmarks (corners, center
 * spot) but won't perfectly align marking boundaries between providers.
 * Revisit if Milestone 1's public Standardizer needs that precision.
 */
export function createStandardizeTransform(
  from: PitchDimensions,
  to: PitchDimensions,
): (point: Point) => Point {
  return (point: Point): Point => fromUnitSquare(to, toUnitSquare(from, point));
}
