import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { PitchDimensions, PitchTypeId } from "../dimensions/types.js";
import { createStandardizeTransform } from "./standardize.js";
import type { Point } from "./types.js";

const PITCH_TYPES: PitchTypeId[] = ["statsbomb", "opta", "uefa"];

function approxPoint(actual: Point, expected: Point, precision = 4): void {
  expect(actual[0]).toBeCloseTo(expected[0], precision);
  expect(actual[1]).toBeCloseTo(expected[1], precision);
}

/**
 * The four geographic corners (top-left, top-right, bottom-left,
 * bottom-right in a standard top-down view), expressed in this provider's
 * native coordinates. Two providers can disagree on the *numeric* corner
 * values (StatsBomb is y-down, Opta/UEFA are y-up) while still agreeing on
 * which corner is geographically "top-left" — that's what standardization
 * must preserve.
 */
function geographicCorners(dims: PitchDimensions) {
  const topY = dims.yDirection === "down" ? 0 : dims.width;
  const bottomY = dims.yDirection === "down" ? dims.width : 0;
  return {
    topLeft: [0, topY] as Point,
    topRight: [dims.length, topY] as Point,
    bottomLeft: [0, bottomY] as Point,
    bottomRight: [dims.length, bottomY] as Point,
  };
}

describe("createStandardizeTransform", () => {
  it.each(PITCH_TYPES)("%s -> %s is the identity function", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const standardize = createStandardizeTransform(dims, dims);
    const samplePoints: Point[] = [
      [0, 0],
      [dims.length, dims.width],
      [dims.length / 3, dims.width / 4],
    ];
    for (const point of samplePoints) {
      approxPoint(standardize(point), point);
    }
  });

  it("maps StatsBomb's center spot to UEFA's and Opta's center spot", () => {
    const statsbombCenter: Point = [60, 40];
    const toUefa = createStandardizeTransform(PITCH_DIMENSIONS.statsbomb, PITCH_DIMENSIONS.uefa);
    const toOpta = createStandardizeTransform(PITCH_DIMENSIONS.statsbomb, PITCH_DIMENSIONS.opta);

    approxPoint(toUefa(statsbombCenter), [52.5, 34]);
    approxPoint(toOpta(statsbombCenter), [50, 50]);
  });

  it("round-trips A -> B -> A for every non-identity pitch-type pair", () => {
    for (const fromType of PITCH_TYPES) {
      for (const toType of PITCH_TYPES) {
        if (fromType === toType) continue;
        const from = PITCH_DIMENSIONS[fromType];
        const to = PITCH_DIMENSIONS[toType];
        const there = createStandardizeTransform(from, to);
        const back = createStandardizeTransform(to, from);

        const samplePoints: Point[] = [
          [0, 0],
          [from.length, from.width],
          [from.length * 0.3, from.width * 0.7],
        ];
        for (const point of samplePoints) {
          approxPoint(back(there(point)), point, 6);
        }
      }
    }
  });

  it("maps all 4 geographic corners consistently across every StatsBomb/Opta/UEFA pair", () => {
    for (const fromType of PITCH_TYPES) {
      for (const toType of PITCH_TYPES) {
        const from = PITCH_DIMENSIONS[fromType];
        const to = PITCH_DIMENSIONS[toType];
        const standardize = createStandardizeTransform(from, to);

        const fromCorners = geographicCorners(from);
        const toCorners = geographicCorners(to);

        approxPoint(standardize(fromCorners.topLeft), toCorners.topLeft, 6);
        approxPoint(standardize(fromCorners.topRight), toCorners.topRight, 6);
        approxPoint(standardize(fromCorners.bottomLeft), toCorners.bottomLeft, 6);
        approxPoint(standardize(fromCorners.bottomRight), toCorners.bottomRight, 6);
      }
    }
  });
});
