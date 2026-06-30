import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { PitchTypeId } from "../dimensions/types.js";
import { computePitchGeometry } from "./geometry.js";

const PITCH_TYPES: PitchTypeId[] = ["statsbomb", "opta", "uefa"];

describe("computePitchGeometry", () => {
  it.each(PITCH_TYPES)("%s: outline matches the pitch extent", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const geometry = computePitchGeometry(dims);
    expect(geometry.outline).toEqual({ x: 0, y: 0, width: dims.length, height: dims.width });
  });

  it.each(PITCH_TYPES)("%s: penalty areas are centered on the pitch's width axis", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const geometry = computePitchGeometry(dims);
    const centerY = dims.width / 2;
    for (const area of geometry.penaltyAreas) {
      expect(area.y + area.height / 2).toBeCloseTo(centerY, 6);
    }
  });

  it.each(PITCH_TYPES)("%s: six-yard boxes sit inside the penalty areas", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const geometry = computePitchGeometry(dims);
    const [leftBox, rightBox] = geometry.sixYardBoxes;
    const [leftArea, rightArea] = geometry.penaltyAreas;

    expect(leftBox.x).toBeGreaterThanOrEqual(leftArea.x);
    expect(leftBox.y).toBeGreaterThan(leftArea.y);
    expect(leftBox.y + leftBox.height).toBeLessThan(leftArea.y + leftArea.height);

    expect(rightBox.x).toBeGreaterThanOrEqual(rightArea.x);
    expect(rightBox.x + rightBox.width).toBeLessThanOrEqual(rightArea.x + rightArea.width);
  });

  it.each(PITCH_TYPES)("%s: center circle radius converts to a plausible ~9.15m", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const geometry = computePitchGeometry(dims);
    const lengthScale = dims.realLengthMeters / dims.length;
    const radiusMeters = geometry.centerCircle.radius * lengthScale;
    expect(radiusMeters).toBeGreaterThan(8);
    expect(radiusMeters).toBeLessThan(10.5);
  });

  it.each(PITCH_TYPES)("%s: goals are centered on the halfway width line", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const geometry = computePitchGeometry(dims);
    const centerY = dims.width / 2;
    for (const goal of geometry.goals) {
      const midY = (goal.from[1] + goal.to[1]) / 2;
      expect(midY).toBeCloseTo(centerY, 6);
    }
  });

  it.each(PITCH_TYPES)("%s: corner arcs sit at all 4 corners of the outline", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    const geometry = computePitchGeometry(dims);
    const expectedCorners = [
      [0, 0],
      [dims.length, 0],
      [0, dims.width],
      [dims.length, dims.width],
    ];
    expect(geometry.cornerArcs.map((arc) => arc.center)).toEqual(expectedCorners);
  });

  it.each(PITCH_TYPES)(
    "%s: penalty arc start/end points sit on the penalty-area edge, symmetric about center",
    (pitchType) => {
      const dims = PITCH_DIMENSIONS[pitchType];
      const geometry = computePitchGeometry(dims);
      const [leftArc] = geometry.penaltyArcs;
      const [leftArea] = geometry.penaltyAreas;
      const boxEdgeX = leftArea.x + leftArea.width;
      const centerY = dims.width / 2;

      expect(leftArc.start[0]).toBeCloseTo(boxEdgeX, 6);
      expect(leftArc.end[0]).toBeCloseTo(boxEdgeX, 6);
      expect((leftArc.start[1] + leftArc.end[1]) / 2).toBeCloseTo(centerY, 6);
    },
  );
});
