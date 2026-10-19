import type { PitchDimensions } from "./types.js";

/**
 * Impect's coordinate grid: a standardised 105x68 m pitch in metres, with the
 * origin on the **centre spot**, so x runs from `-52.5` to `+52.5` and y from
 * `-34` to `+34`, with y increasing toward the attacking team's left.
 * mplsoccer calls this type `impect` too.
 *
 * Its geometry is SkillCorner's, and the markings are UEFA's, because a
 * penalty area is 16.5 m deep on any pitch. It is a type of its own because
 * the two providers mean different things by it: Impect standardises every
 * stadium to 105x68, where SkillCorner's coordinates are each pitch's real
 * metres and take per-match `dimensions`.
 *
 * Impect publish each position twice. `coordinates` are absolute, so teams
 * swap ends at half time; `adjCoordinates` turn every event so the acting
 * team attacks towards `+x`. Both plot raw on this type.
 */
export const impectDimensions: PitchDimensions = {
  pitchType: "impect",
  length: 105,
  width: 68,
  origin: "center",
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
