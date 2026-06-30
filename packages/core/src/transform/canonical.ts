import type { PitchDimensions } from "../dimensions/types.js";
import type { Point } from "./types.js";

/**
 * Normalizes a point into a "canonical pitch frame": real provider units,
 * origin top-left, y increasing downward — regardless of the provider's
 * native origin/yDirection. Preserves the pitch's true length:width ratio
 * (unlike a [0,1] unit-square normalization), which is what correct,
 * non-distorted pixel layout requires.
 *
 * Assumes x always increases left-to-right starting at 0 for every
 * supported provider (true for statsbomb/opta/uefa). Center-origin
 * providers (tracab, skillcorner — out of scope for M0) would need an
 * x-offset term added here.
 */
export function toCanonicalFrame(dimensions: PitchDimensions, point: Point): Point {
  const [x, y] = point;
  const canonicalY = dimensions.yDirection === "down" ? y : dimensions.width - y;
  return [x, canonicalY];
}

/** Inverse of {@link toCanonicalFrame}. */
export function fromCanonicalFrame(dimensions: PitchDimensions, point: Point): Point {
  const [x, canonicalY] = point;
  const y = dimensions.yDirection === "down" ? canonicalY : dimensions.width - canonicalY;
  return [x, y];
}

/**
 * Normalizes a point into the [0,1] x [0,1] unit square: relative position
 * along the pitch's length/width axes, independent of the provider's real
 * unit scale. Used for cross-provider standardization, where "50% along the
 * length" should map consistently regardless of each provider's grid size.
 * NOT used for pixel layout — it discards the real length:width aspect
 * ratio, which would distort rendering.
 */
export function toUnitSquare(dimensions: PitchDimensions, point: Point): Point {
  const [canonicalX, canonicalY] = toCanonicalFrame(dimensions, point);
  return [canonicalX / dimensions.length, canonicalY / dimensions.width];
}

/** Inverse of {@link toUnitSquare}. */
export function fromUnitSquare(dimensions: PitchDimensions, point: Point): Point {
  const [unitX, unitY] = point;
  return fromCanonicalFrame(dimensions, [unitX * dimensions.length, unitY * dimensions.width]);
}
