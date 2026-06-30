import type { PitchDimensions } from "./types.js";

/**
 * StatsBomb's coordinate grid: 120x80 abstract units, origin top-left, y increases
 * downward. Marking constants sourced from mplsoccer's statsbomb_dims().
 */
export const statsbombDimensions: PitchDimensions = {
  pitchType: "statsbomb",
  length: 120,
  width: 80,
  origin: "top-left",
  yDirection: "down",
  normalized: false,
  realLengthMeters: 105,
  realWidthMeters: 68,
  markings: {
    penaltyAreaLength: 18,
    penaltyAreaWidth: 44,
    sixYardLength: 6,
    sixYardWidth: 20,
    centerCircleRadius: 10,
    penaltySpotDistance: 12,
    cornerArcRadius: 1.093,
    goalWidth: 8,
  },
};
