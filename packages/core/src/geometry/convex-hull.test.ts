import { describe, expect, it } from "vitest";
import { computeConvexHull } from "./convex-hull.js";

describe("computeConvexHull", () => {
  it("excludes interior points, keeping only the square's corners", () => {
    const hull = computeConvexHull([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [5, 5], // interior
      [3, 3], // interior
    ]);

    expect(hull).toHaveLength(4);
    for (const interior of [
      [5, 5],
      [3, 3],
    ]) {
      expect(hull).not.toContainEqual(interior);
    }
  });

  it("returns all points as-is when fewer than 3 distinct points are given", () => {
    expect(computeConvexHull([[1, 1]])).toEqual([[1, 1]]);
    expect(
      computeConvexHull([
        [1, 1],
        [2, 2],
      ]),
    ).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  it("deduplicates identical points before hulling", () => {
    const hull = computeConvexHull([
      [0, 0],
      [0, 0],
      [4, 0],
      [4, 0],
    ]);
    expect(hull).toHaveLength(2);
  });

  it("collapses collinear points into just the two endpoints", () => {
    const hull = computeConvexHull([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
    expect(hull).toHaveLength(2);
    expect(hull).toContainEqual([0, 0]);
    expect(hull).toContainEqual([3, 0]);
  });

  it("produces a convex, correctly-wound polygon for a random-ish cluster", () => {
    const points: [number, number][] = [
      [0, 0],
      [4, -2],
      [8, 0],
      [8, 8],
      [4, 10],
      [0, 8],
      [4, 4], // interior
    ];
    const hull = computeConvexHull(points);
    expect(hull).not.toContainEqual([4, 4]);
    expect(hull.length).toBeGreaterThanOrEqual(5);
  });
});
