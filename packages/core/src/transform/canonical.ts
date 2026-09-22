import type { PitchDimensions } from "../dimensions/types.js";
import type { Point } from "./types.js";

/**
 * Where the pitch's minimum corner sits in the provider's own coordinates.
 *
 * Zero for every corner-origin provider — the offset only exists for
 * center-origin grids like SkillCorner's, where x runs `-length/2` to
 * `+length/2`. Which corner a corner-origin provider uses is `yDirection`'s
 * business, not this function's.
 */
function originOffset(dimensions: PitchDimensions): Point {
  return dimensions.origin === "center" ? [-dimensions.length / 2, -dimensions.width / 2] : [0, 0];
}

/**
 * How many real-world metres one grid unit covers, per axis.
 *
 * `[1, 1]` for every provider whose grid is already in real units — a UEFA or
 * SkillCorner unit *is* a metre — and for StatsBomb, whose abstract 120x80
 * grid has always been rendered at its own shape and stays that way.
 *
 * Percentage grids are the exception, and the reason this exists. Opta and
 * Wyscout both run `0..100` on *both* axes, but those axes measure different
 * amounts of grass: x spans 105 m, y only 68 m. Deriving the pitch's shape
 * from `length`/`width` alone therefore draws a square, which is
 * [issue #2](https://github.com/yribeiro/pitchkit/issues/2). Converting to
 * metres first fixes it and keeps the pixel scale a single number — pixels
 * per metre — rather than stretching the two axes independently, so a centre
 * circle stays a circle.
 */
export function displayUnitScale(dimensions: PitchDimensions): Point {
  if (!dimensions.normalized) return [1, 1];
  return [
    dimensions.realLengthMeters / dimensions.length,
    dimensions.realWidthMeters / dimensions.width,
  ];
}

/**
 * Maps a point into the pitch's **extent frame**: `0..length` by `0..width`,
 * with the y-axis still pointing whichever way the provider points it.
 *
 * This is an identity function for every corner-origin provider
 * (statsbomb/opta/uefa), and exists so that code which reasons about "is this
 * point on the pitch" or "which bin does it fall in" can keep assuming a box
 * that starts at zero, without silently discarding half of a center-origin
 * provider's data.
 */
export function toExtentFrame(dimensions: PitchDimensions, point: Point): Point {
  const [offsetX, offsetY] = originOffset(dimensions);
  return [point[0] - offsetX, point[1] - offsetY];
}

/** Inverse of {@link toExtentFrame}. */
export function fromExtentFrame(dimensions: PitchDimensions, point: Point): Point {
  const [offsetX, offsetY] = originOffset(dimensions);
  return [point[0] + offsetX, point[1] + offsetY];
}

/**
 * Normalizes a point into a "canonical pitch frame": real provider units,
 * origin top-left, y increasing downward — regardless of the provider's
 * native origin/yDirection. Preserves the pitch's true length:width ratio
 * (unlike a [0,1] unit-square normalization), which is what correct,
 * non-distorted pixel layout requires.
 */
export function toCanonicalFrame(dimensions: PitchDimensions, point: Point): Point {
  const [x, y] = toExtentFrame(dimensions, point);
  const canonicalY = dimensions.yDirection === "down" ? y : dimensions.width - y;
  return [x, canonicalY];
}

/** Inverse of {@link toCanonicalFrame}. */
export function fromCanonicalFrame(dimensions: PitchDimensions, point: Point): Point {
  const [x, canonicalY] = point;
  const y = dimensions.yDirection === "down" ? canonicalY : dimensions.width - canonicalY;
  return fromExtentFrame(dimensions, [x, y]);
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
