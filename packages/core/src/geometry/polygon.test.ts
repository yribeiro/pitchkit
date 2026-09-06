import { describe, expect, it } from "vitest";
import { computePolygonCentroid } from "./polygon.js";

describe("computePolygonCentroid", () => {
  it("returns the mean of a triangle's vertices", () => {
    const centroid = computePolygonCentroid([
      [0, 0],
      [6, 0],
      [3, 9],
    ]);
    expect(centroid[0]).toBeCloseTo(3, 6);
    expect(centroid[1]).toBeCloseTo(3, 6);
  });

  it("returns the center of a square", () => {
    const centroid = computePolygonCentroid([
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ]);
    expect(centroid[0]).toBeCloseTo(2, 6);
    expect(centroid[1]).toBeCloseTo(2, 6);
  });

  it("returns the point itself for a single-point input", () => {
    expect(computePolygonCentroid([[5, 7]])).toEqual([5, 7]);
  });

  it("returns the origin for an empty input", () => {
    expect(computePolygonCentroid([])).toEqual([0, 0]);
  });
});
