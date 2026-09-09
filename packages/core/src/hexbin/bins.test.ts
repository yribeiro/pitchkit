import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { HexbinLayer } from "../scene/types.js";
import { computeHexBins, hexCorners } from "./bins.js";

const statsbomb = PITCH_DIMENSIONS.statsbomb; // 120 x 80

function layer(overrides: Partial<HexbinLayer<{ x: number; y: number; w?: number }>> = {}) {
  return {
    type: "hexbin" as const,
    data: [],
    x: (d: { x: number }) => d.x,
    y: (d: { y: number }) => d.y,
    ...overrides,
  };
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

describe("hexCorners", () => {
  it("returns six vertices, all at the circumradius from the centre", () => {
    const corners = hexCorners(10, 20, 3);
    expect(corners).toHaveLength(6);
    for (const [x, y] of corners) {
      expect(distance(x, y, 10, 20)).toBeCloseTo(3, 6);
    }
  });

  it("is pointy-top: the first vertex sits directly above the centre", () => {
    const [top] = hexCorners(10, 20, 3);
    expect(top?.[0]).toBeCloseTo(10, 6);
    expect(top?.[1]).toBeCloseTo(17, 6);
  });

  it("has equal-length sides", () => {
    const corners = hexCorners(0, 0, 5);
    const sides = corners.map((corner, i) => {
      const next = corners[(i + 1) % 6] as readonly [number, number];
      return distance(corner[0], corner[1], next[0], next[1]);
    });
    for (const side of sides) expect(side).toBeCloseTo(5, 6);
  });
});

describe("computeHexBins", () => {
  it("returns no bins for empty data (empty cells are omitted, not zero-filled)", () => {
    expect(computeHexBins(layer(), statsbomb)).toEqual([]);
  });

  it("sizes hexagons so binsX columns span the pitch length", () => {
    const bins = computeHexBins(layer({ data: [{ x: 60, y: 40 }], binsX: 10 }), statsbomb);
    // Horizontal spacing is √3·r, so r = length / (binsX · √3).
    expect(bins[0]?.radius).toBeCloseTo(120 / (10 * Math.sqrt(3)), 6);
  });

  it("collapses points in the same hexagon into one bin and counts them", () => {
    const data = [
      { x: 60, y: 40 },
      { x: 60.1, y: 40.1 },
      { x: 59.9, y: 39.9 },
    ];
    const bins = computeHexBins(layer({ data, binsX: 10 }), statsbomb);
    expect(bins).toHaveLength(1);
    expect(bins[0]?.value).toBe(3);
  });

  it("sums a weight accessor per hexagon when provided, instead of counting", () => {
    const data = [
      { x: 60, y: 40, w: 0.25 },
      { x: 60.1, y: 40.1, w: 0.75 },
    ];
    const bins = computeHexBins(layer({ data, binsX: 10, weight: (d) => d.w ?? 0 }), statsbomb);
    expect(bins).toHaveLength(1);
    expect(bins[0]?.value).toBeCloseTo(1, 6);
  });

  it("ignores points outside the pitch extent", () => {
    const data = [
      { x: -1, y: 40 },
      { x: 121, y: 40 },
      { x: 60, y: -1 },
      { x: 60, y: 81 },
    ];
    expect(computeHexBins(layer({ data, binsX: 10 }), statsbomb)).toEqual([]);
  });

  it("assigns each point to a hexagon that actually contains it", () => {
    const data = Array.from({ length: 300 }, (_, i) => ({
      x: ((i * 37) % 1200) / 10,
      y: ((i * 53) % 800) / 10,
    }));
    const bins = computeHexBins(layer({ data, binsX: 12 }), statsbomb);
    const radius = bins[0]?.radius as number;

    // In a hexagonal lattice no point is further than the circumradius
    // from its own hexagon's centre, so this fails for any point that got
    // snapped to the wrong cell.
    for (const point of data) {
      const nearest = Math.min(...bins.map((b) => distance(point.x, point.y, b.x, b.y)));
      expect(nearest).toBeLessThanOrEqual(radius + 1e-9);
    }
  });

  it("keeps every point: bin values sum to the number of points", () => {
    const data = Array.from({ length: 120 }, (_, i) => ({
      x: (i * 0.97) % 120,
      y: (i * 0.61) % 80,
    }));
    const bins = computeHexBins(layer({ data, binsX: 8 }), statsbomb);
    expect(bins.reduce((sum, b) => sum + b.value, 0)).toBe(data.length);
  });

  it("uses a sensible default column count when binsX is unset", () => {
    const bins = computeHexBins(layer({ data: [{ x: 60, y: 40 }] }), statsbomb);
    expect(bins[0]?.radius).toBeCloseTo(120 / (20 * Math.sqrt(3)), 6);
  });

  it("offsets odd rows by half a column, which is what makes the lattice hexagonal", () => {
    const radius = 120 / (10 * Math.sqrt(3));
    const dx = radius * Math.sqrt(3);
    const dy = radius * 1.5;
    // One point snapped to the row-0 origin, one to the row-1 centre below it.
    const bins = computeHexBins(
      layer({
        data: [
          { x: 0, y: 0 },
          { x: dx / 2, y: dy },
        ],
        binsX: 10,
      }),
      statsbomb,
    );
    const rowOne = bins.find((b) => Math.abs(b.y - dy) < 1e-9);
    expect(rowOne?.x).toBeCloseTo(dx / 2, 6);
  });
});
