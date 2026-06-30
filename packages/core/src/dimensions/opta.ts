import type { PitchDimensions } from "./types.js";

/**
 * Opta's coordinate grid: normalized 0-100 on both axes, origin bottom-left, y
 * increases upward. Marking constants sourced from mplsoccer's opta_dims().
 */
export const optaDimensions: PitchDimensions = {
  pitchType: "opta",
  length: 100,
  width: 100,
  origin: "bottom-left",
  yDirection: "up",
  normalized: true,
  realLengthMeters: 105,
  realWidthMeters: 68,
  markings: {
    penaltyAreaLength: 17.0,
    penaltyAreaWidth: 57.8,
    sixYardLength: 5.8,
    sixYardWidth: 26.4,
    centerCircleRadius: 9.15,
    penaltySpotDistance: 11.5,
    cornerArcRadius: 1.0,
    goalWidth: 9.6,
  },
};
