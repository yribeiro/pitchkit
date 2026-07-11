import { describe, expect, it } from "vitest";
import { computeCometQuad } from "./comet-geometry.js";
import type { Point } from "../transform/types.js";

describe("computeCometQuad", () => {
  it("returns 4 corners", () => {
    const quad = computeCometQuad([0, 0], [10, 0], 2, 6);
    expect(quad).toHaveLength(4);
  });

  it("the two corners at `start` are startWidth apart; the two at `end` are endWidth apart", () => {
    const start: Point = [0, 0];
    const end: Point = [10, 0];
    const [startA, endA, endB, startB] = computeCometQuad(start, end, 2, 6);

    expect(Math.hypot(startA[0] - startB[0], startA[1] - startB[1])).toBeCloseTo(2, 6);
    expect(Math.hypot(endA[0] - endB[0], endA[1] - endB[1])).toBeCloseTo(6, 6);
  });

  it("the taper is perpendicular to the start->end line", () => {
    const start: Point = [0, 0];
    const end: Point = [10, 0]; // horizontal shaft
    const [startA, , , startB] = computeCometQuad(start, end, 4, 4);

    // perpendicular to a horizontal line is vertical: same x as start, y offset
    expect(startA[0]).toBeCloseTo(0, 6);
    expect(startB[0]).toBeCloseTo(0, 6);
    expect(startA[1]).toBeCloseTo(-startB[1], 6);
  });

  it("handles a zero-length line (start === end) without producing NaN", () => {
    const quad = computeCometQuad([5, 5], [5, 5], 2, 2);
    for (const [x, y] of quad) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });
});
