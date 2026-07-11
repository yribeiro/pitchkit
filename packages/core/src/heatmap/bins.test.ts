import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { HeatmapLayer } from "../scene/types.js";
import { computeHeatmapBins } from "./bins.js";

const statsbomb = PITCH_DIMENSIONS.statsbomb; // 120 x 80

function layer(overrides: Partial<HeatmapLayer<{ x: number; y: number; w?: number }>> = {}) {
  return {
    type: "heatmap" as const,
    data: [],
    x: (d: { x: number }) => d.x,
    y: (d: { y: number }) => d.y,
    ...overrides,
  };
}

describe("computeHeatmapBins", () => {
  it("produces binsX * binsY bins with the default grid when unset", () => {
    const bins = computeHeatmapBins(layer(), statsbomb);
    expect(bins).toHaveLength(6 * 5);
  });

  it("produces a custom-size grid, and every bin tiles the pitch extent exactly", () => {
    const bins = computeHeatmapBins(layer({ binsX: 4, binsY: 2 }), statsbomb);
    expect(bins).toHaveLength(8);

    const totalWidth = bins.reduce((sum, b) => (b.y === 0 ? sum + b.width : sum), 0);
    const totalHeight = bins.reduce((sum, b) => (b.x === 0 ? sum + b.height : sum), 0);
    expect(totalWidth).toBeCloseTo(statsbomb.length, 6);
    expect(totalHeight).toBeCloseTo(statsbomb.width, 6);
  });

  it("returns all-zero bins for empty data", () => {
    const bins = computeHeatmapBins(layer({ binsX: 3, binsY: 2 }), statsbomb);
    expect(bins.every((b) => b.value === 0)).toBe(true);
  });

  it("counts points per bin by default (no weight accessor)", () => {
    const data = [
      { x: 5, y: 5 }, // bin (0,0)
      { x: 5, y: 5 }, // bin (0,0) again
      { x: 115, y: 75 }, // bin (3,1) in a 4x2 grid
    ];
    const bins = computeHeatmapBins(layer({ data, binsX: 4, binsY: 2 }), statsbomb);

    const originBin = bins.find((b) => b.x === 0 && b.y === 0);
    const farBin = bins.find((b) => b.x === 90 && b.y === 40);
    expect(originBin?.value).toBe(2);
    expect(farBin?.value).toBe(1);
    expect(bins.filter((b) => b.value === 0)).toHaveLength(6);
  });

  it("sums a weight accessor per bin when provided, instead of counting", () => {
    const data = [
      { x: 5, y: 5, w: 0.3 },
      { x: 5, y: 5, w: 0.5 },
    ];
    const bins = computeHeatmapBins(
      layer({ data, binsX: 4, binsY: 2, weight: (d) => d.w ?? 0 }),
      statsbomb,
    );
    const originBin = bins.find((b) => b.x === 0 && b.y === 0);
    expect(originBin?.value).toBeCloseTo(0.8, 6);
  });

  it("places a point exactly on the far edge (x === length, y === width) in the last bin, not dropped", () => {
    const data = [{ x: 120, y: 80 }];
    const bins = computeHeatmapBins(layer({ data, binsX: 4, binsY: 2 }), statsbomb);
    const totalCount = bins.reduce((sum, b) => sum + b.value, 0);
    expect(totalCount).toBe(1);

    const lastBin = bins.find((b) => b.x === 90 && b.y === 40);
    expect(lastBin?.value).toBe(1);
  });

  it("ignores points outside the pitch extent rather than clamping them into an edge bin", () => {
    const data = [
      { x: -5, y: 40 },
      { x: 60, y: -1 },
      { x: 130, y: 40 },
      { x: 60, y: 90 },
    ];
    const bins = computeHeatmapBins(layer({ data, binsX: 4, binsY: 2 }), statsbomb);
    const totalCount = bins.reduce((sum, b) => sum + b.value, 0);
    expect(totalCount).toBe(0);
  });

  it("each bin's geometry has the expected width/height for the grid size", () => {
    const bins = computeHeatmapBins(layer({ binsX: 4, binsY: 2 }), statsbomb);
    for (const bin of bins) {
      expect(bin.width).toBeCloseTo(30, 6); // 120 / 4
      expect(bin.height).toBeCloseTo(40, 6); // 80 / 2
    }
  });
});
