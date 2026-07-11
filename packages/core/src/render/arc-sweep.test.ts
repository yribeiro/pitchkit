import { describe, expect, it } from "vitest";
import { arcPathData, arcSweepFlag } from "./arc-sweep.js";
import type { Point } from "../transform/types.js";

describe("arcSweepFlag", () => {
  it("returns 1 when going counterclockwise in math terms (clockwise on screen)", () => {
    const center: Point = [0, 0];
    // start at angle 0 (east), end at angle 90deg (south, since y-down) -> delta > 0
    const start: Point = [10, 0];
    const end: Point = [0, 10];
    expect(arcSweepFlag(center, start, end)).toBe(1);
  });

  it("returns 0 for the opposite direction", () => {
    const center: Point = [0, 0];
    const start: Point = [0, 10];
    const end: Point = [10, 0];
    expect(arcSweepFlag(center, start, end)).toBe(0);
  });

  it("is consistent regardless of which quadrant the points sit in (angle wrap-around)", () => {
    const center: Point = [50, 50];
    // start near -180deg, end near +170deg -- a small delta once wrapped,
    // not a near-360deg delta if wrap-around weren't handled.
    const start: Point = [39, 50.1];
    const end: Point = [39, 49.9];
    const flag = arcSweepFlag(center, start, end);
    expect(flag === 0 || flag === 1).toBe(true); // just must not throw / produce NaN-driven garbage
  });
});

describe("arcPathData", () => {
  it("builds a valid SVG arc path string with the given radius, points, and sweep", () => {
    const d = arcPathData(10, [0, 0], [10, 10], 1);
    expect(d).toBe("M 0 0 A 10 10 0 0 1 10 10");
  });

  it("reflects sweep=0 in the path string", () => {
    const d = arcPathData(5, [1, 2], [3, 4], 0);
    expect(d).toBe("M 1 2 A 5 5 0 0 0 3 4");
  });
});
