import type { PitchDimensions } from "./types.js";

/**
 * Wyscout's coordinate grid: normalized 0-100 on both axes, origin
 * **top-left**, y increases downward. Marking constants sourced from
 * mplsoccer's wyscout_dims().
 *
 * **It is not Opta with a different name.** Both are 0-100 percentage grids,
 * but Opta's origin is bottom-left with y increasing upward, and Wyscout's is
 * top-left with y increasing downward (`invert_y=True` in mplsoccer). Plotting
 * Wyscout data on `type="opta"` therefore mirrors the pitch vertically, and
 * nothing errors — every coordinate is still in range. The width-axis marking
 * constants differ between the two as well, so they are not interchangeable in
 * either direction.
 *
 * Because the grid is normalized, `x` spans 105 m of grass while `y` spans only
 * 68 m. `displayUnitScale` in `transform/canonical.ts` is what converts those
 * units to metres so the pitch renders as a rectangle rather than a square; see
 * [issue #2](https://github.com/yribeiro/pitchkit/issues/2).
 */
export const wyscoutDimensions: PitchDimensions = {
  pitchType: "wyscout",
  length: 100,
  width: 100,
  origin: "top-left",
  yDirection: "down",
  normalized: true,
  realLengthMeters: 105,
  realWidthMeters: 68,
  markings: {
    penaltyAreaLength: 16.0,
    penaltyAreaWidth: 62.0,
    sixYardLength: 6.0,
    sixYardWidth: 26.0,
    // Radii stay in metres rather than grid units: a circle has one radius,
    // and the two axes of a percentage grid scale differently. The renderer
    // multiplies these by the pixels-per-metre scale directly, which is why
    // Opta carries the same 9.15 / 1.0 values as UEFA.
    centerCircleRadius: 9.15,
    penaltySpotDistance: 10.0,
    cornerArcRadius: 1.0,
    goalWidth: 12.0,
  },
};
