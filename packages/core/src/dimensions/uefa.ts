import type { PitchDimensions } from "./types.js";

/**
 * UEFA's coordinate grid: real metres (105x68), origin bottom-left, y increases
 * upward. Marking constants sourced from mplsoccer's uefa_dims().
 */
export const uefaDimensions: PitchDimensions = {
  pitchType: "uefa",
  length: 105,
  width: 68,
  origin: "bottom-left",
  yDirection: "up",
  normalized: false,
  realLengthMeters: 105,
  realWidthMeters: 68,
  markings: {
    penaltyAreaLength: 16.5,
    penaltyAreaWidth: 40.32,
    sixYardLength: 5.5,
    sixYardWidth: 18.32,
    centerCircleRadius: 9.15,
    penaltySpotDistance: 11.0,
    cornerArcRadius: 1.0,
    goalWidth: 7.32,
  },
};
