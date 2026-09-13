import type { PitchDimensions } from "./types.js";

/**
 * SkillCorner's coordinate grid: real metres with the origin on the **centre
 * spot**, so x runs from `-length/2` to `+length/2` and y from `-width/2` to
 * `+width/2`, with y increasing toward the attacking team's left.
 *
 * The markings are UEFA's, because both grids are plain metres and a penalty
 * area is 16.5 m deep on any pitch — they are not re-derived here.
 *
 * **The defaults are 105x68, but SkillCorner pitches are not all that size.**
 * Their open data spans 104, 105 and 106 m, because these are the stadiums'
 * real dimensions rather than a normalised grid. Pass the match's own values
 * to `getPitchDimensions("skillcorner", { length, width })` when you want the
 * outline exact; the markings stay put either way, which is correct — a
 * six-yard box does not grow with the pitch.
 */
export const skillcornerDimensions: PitchDimensions = {
  pitchType: "skillcorner",
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
