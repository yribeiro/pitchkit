import type { PitchDimensions } from "./types.js";

/**
 * Metrica Sports' coordinate grid: normalized `0..1` on both axes, origin
 * **top-left**, y increasing downward, so `(0.5, 0.5)` is the centre spot and
 * `(1, 1)` the bottom-right corner flag. mplsoccer calls this type
 * `metricasports`.
 *
 * The orientation is Wyscout's, but the extent is not: Wyscout runs `0..100`,
 * so Metrica data plotted on `type="wyscout"` lands in one corner, and the
 * reverse spreads it far off the pitch.
 *
 * Every marking except the radii is a real-metre distance divided by the
 * matching axis of a 105x68 m pitch, the size Metrica publish for their open
 * sample games. That is how mplsoccer's `metricasports_dims()` derives them
 * too. A penalty area is therefore `16.5 / 105` long and `40.32 / 68` wide.
 *
 * Radii stay in metres, as on every percentage grid: a circle has one radius,
 * and the two axes of a normalized grid cover different amounts of grass.
 * `computePitchGeometry` converts through `displayUnitScale` wherever a radius
 * meets a grid coordinate, which matters far more here than on a `0..100`
 * grid, where one unit is roughly one metre anyway.
 */
export const metricaDimensions: PitchDimensions = {
  pitchType: "metrica",
  length: 1,
  width: 1,
  origin: "top-left",
  yDirection: "down",
  normalized: true,
  realLengthMeters: 105,
  realWidthMeters: 68,
  markings: {
    penaltyAreaLength: 16.5 / 105,
    penaltyAreaWidth: 40.32 / 68,
    sixYardLength: 5.5 / 105,
    sixYardWidth: 18.32 / 68,
    centerCircleRadius: 9.15,
    penaltySpotDistance: 11 / 105,
    cornerArcRadius: 1.0,
    goalWidth: 7.32 / 68,
  },
};
