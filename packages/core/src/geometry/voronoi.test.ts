import { describe, expect, it } from "vitest";
import { clipPolygonByHalfPlane, computeVoronoiCells } from "./voronoi.js";
import type { Rect } from "../scene/geometry.js";

describe("clipPolygonByHalfPlane", () => {
  it("keeps the whole polygon when it's entirely inside the half-plane", () => {
    const square = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ] as const;
    const clipped = clipPolygonByHalfPlane(square, [-5, 0], [1, 0]);
    expect(clipped).toEqual(square);
  });

  it("clips a square in half with a vertical bisector", () => {
    const square = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ] as const;
    const clipped = clipPolygonByHalfPlane(square, [5, 0], [-1, 0]);
    for (const [x] of clipped) {
      expect(x).toBeLessThanOrEqual(5 + 1e-9);
    }
    expect(clipped.some(([x]) => x === 0)).toBe(true);
  });

  it("returns an empty polygon when entirely outside the half-plane", () => {
    const square = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ] as const;
    const clipped = clipPolygonByHalfPlane(square, [-5, 0], [-1, 0]);
    expect(clipped).toHaveLength(0);
  });
});

describe("computeVoronoiCells", () => {
  const bounds: Rect = { x: 0, y: 0, width: 10, height: 10 };

  it("splits two sites along their perpendicular bisector", () => {
    const [cellA, cellB] = computeVoronoiCells(
      [
        [2, 5],
        [8, 5],
      ],
      bounds,
    );

    expect(cellA).toBeDefined();
    expect(cellB).toBeDefined();
    for (const [x] of cellA ?? []) expect(x).toBeLessThanOrEqual(5 + 1e-9);
    for (const [x] of cellB ?? []) expect(x).toBeGreaterThanOrEqual(5 - 1e-9);
  });

  it("returns the full bounds rect for a single site", () => {
    const [cell] = computeVoronoiCells([[5, 5]], bounds);
    expect(cell).toHaveLength(4);
  });

  it("produces one cell per site, each with at least 3 vertices for a non-degenerate layout", () => {
    const sites: [number, number][] = [
      [2, 2],
      [8, 2],
      [5, 8],
    ];
    const cells = computeVoronoiCells(sites, bounds);
    expect(cells).toHaveLength(3);
    for (const cell of cells) {
      expect(cell.length).toBeGreaterThanOrEqual(3);
    }
  });
});
