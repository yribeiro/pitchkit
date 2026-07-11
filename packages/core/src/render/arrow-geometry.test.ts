import { describe, expect, it } from "vitest";
import { computeArrowHeadCorners } from "./arrow-geometry.js";
import type { Point } from "../transform/types.js";

describe("computeArrowHeadCorners", () => {
  it("both corners sit behind the tip (end), at headSize distance", () => {
    const start: Point = [0, 0];
    const end: Point = [10, 0];
    const [cornerA, cornerB] = computeArrowHeadCorners(start, end, 3);

    expect(cornerA[0]).toBeLessThan(end[0]);
    expect(cornerB[0]).toBeLessThan(end[0]);
    expect(Math.hypot(cornerA[0] - end[0], cornerA[1] - end[1])).toBeCloseTo(3, 6);
    expect(Math.hypot(cornerB[0] - end[0], cornerB[1] - end[1])).toBeCloseTo(3, 6);
  });

  it("the two corners are symmetric about the shaft line", () => {
    const start: Point = [0, 0];
    const end: Point = [10, 0];
    const [cornerA, cornerB] = computeArrowHeadCorners(start, end, 3);

    // shaft is horizontal (y=0), so corners should be mirrored across it
    expect(cornerA[1]).toBeCloseTo(-cornerB[1], 6);
  });

  it("points in the direction of travel regardless of shaft angle", () => {
    const start: Point = [0, 0];
    const end: Point = [0, 10]; // pointing straight down (SVG y-down)
    const [cornerA, cornerB] = computeArrowHeadCorners(start, end, 3);

    expect(cornerA[1]).toBeLessThan(end[1]);
    expect(cornerB[1]).toBeLessThan(end[1]);
  });
});
