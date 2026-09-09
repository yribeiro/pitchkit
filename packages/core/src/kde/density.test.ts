import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { KdeLayer } from "../scene/types.js";
import { computeKdeGrid, silvermanBandwidth } from "./density.js";

const statsbomb = PITCH_DIMENSIONS.statsbomb; // 120 x 80

function layer(overrides: Partial<KdeLayer<{ x: number; y: number; w?: number }>> = {}) {
  return {
    type: "kde" as const,
    data: [],
    x: (d: { x: number }) => d.x,
    y: (d: { y: number }) => d.y,
    ...overrides,
  };
}

/** The grid cell whose centre is nearest to a provider-coordinate point. */
function cellAt(
  grid: { cols: number; cellWidth: number; cellHeight: number; values: readonly number[] },
  x: number,
  y: number,
): number {
  const col = Math.floor(x / grid.cellWidth);
  const row = Math.floor(y / grid.cellHeight);
  return grid.values[row * grid.cols + col] ?? 0;
}

describe("silvermanBandwidth", () => {
  it("returns 0 for fewer than two values (no spread to estimate)", () => {
    expect(silvermanBandwidth([])).toBe(0);
    expect(silvermanBandwidth([42])).toBe(0);
  });

  it("is the sample standard deviation scaled by n^(-1/6)", () => {
    const values = [1, 2, 3, 4, 5];
    // sample sd of 1..5 is sqrt(2.5)
    expect(silvermanBandwidth(values)).toBeCloseTo(Math.sqrt(2.5) * 5 ** (-1 / 6), 10);
  });

  it("returns 0 for identical values (zero variance)", () => {
    expect(silvermanBandwidth([7, 7, 7, 7])).toBe(0);
  });

  it("grows with the spread of the data", () => {
    expect(silvermanBandwidth([0, 1, 2, 3])).toBeLessThan(silvermanBandwidth([0, 10, 20, 30]));
  });
});

describe("computeKdeGrid", () => {
  it("returns an all-zero grid of the requested resolution for empty data", () => {
    const grid = computeKdeGrid(layer({ resolution: 8 }), statsbomb);
    expect(grid.cols).toBe(8);
    expect(grid.rows).toBe(8);
    expect(grid.values).toHaveLength(64);
    expect(grid.maxValue).toBe(0);
    expect(grid.values.every((v) => v === 0)).toBe(true);
  });

  it("defaults to a 64x64 grid", () => {
    const grid = computeKdeGrid(layer(), statsbomb);
    expect(grid.cols).toBe(64);
    expect(grid.values).toHaveLength(64 * 64);
  });

  it("cells tile the pitch extent exactly", () => {
    const grid = computeKdeGrid(layer({ resolution: 16 }), statsbomb);
    expect(grid.cellWidth * grid.cols).toBeCloseTo(statsbomb.length, 6);
    expect(grid.cellHeight * grid.rows).toBeCloseTo(statsbomb.width, 6);
  });

  it("peaks at the data and decays away from it", () => {
    const grid = computeKdeGrid(
      layer({ data: [{ x: 60, y: 40 }], resolution: 32, bandwidth: 10 }),
      statsbomb,
    );
    const atPoint = cellAt(grid, 60, 40);
    const nearby = cellAt(grid, 75, 40);
    const faraway = cellAt(grid, 110, 75);

    expect(atPoint).toBeGreaterThan(nearby);
    expect(nearby).toBeGreaterThan(faraway);
    expect(grid.maxValue).toBeCloseTo(atPoint, 6);
  });

  it("smooths: a single point spreads density beyond its own cell, unlike a histogram", () => {
    const grid = computeKdeGrid(
      layer({ data: [{ x: 60, y: 40 }], resolution: 32, bandwidth: 10 }),
      statsbomb,
    );
    expect(grid.values.filter((v) => v > 0).length).toBeGreaterThan(1);
  });

  it("a larger bandwidth spreads density further", () => {
    const tight = computeKdeGrid(
      layer({ data: [{ x: 60, y: 40 }], resolution: 32, bandwidth: 3 }),
      statsbomb,
    );
    const loose = computeKdeGrid(
      layer({ data: [{ x: 60, y: 40 }], resolution: 32, bandwidth: 20 }),
      statsbomb,
    );
    const nonZero = (values: readonly number[]) => values.filter((v) => v > 0).length;
    expect(nonZero(loose.values)).toBeGreaterThan(nonZero(tight.values));
  });

  it("reports the bandwidth it used, whether given or derived", () => {
    const explicit = computeKdeGrid(layer({ data: [{ x: 60, y: 40 }], bandwidth: 7 }), statsbomb);
    expect(explicit.bandwidthX).toBe(7);
    expect(explicit.bandwidthY).toBe(7);

    const derived = computeKdeGrid(
      layer({
        data: [
          { x: 10, y: 10 },
          { x: 110, y: 70 },
          { x: 60, y: 40 },
        ],
      }),
      statsbomb,
    );
    // The x spread is wider than the y spread on a 120x80 pitch, so
    // Silverman's per-axis rule must produce a wider x bandwidth.
    expect(derived.bandwidthX).toBeGreaterThan(derived.bandwidthY);
  });

  it("falls back to one grid cell of smoothing when the data has no spread", () => {
    const grid = computeKdeGrid(
      layer({
        data: [
          { x: 60, y: 40 },
          { x: 60, y: 40 },
        ],
        resolution: 16,
      }),
      statsbomb,
    );
    expect(grid.bandwidthX).toBeCloseTo(grid.cellWidth, 6);
    expect(grid.bandwidthY).toBeCloseTo(grid.cellHeight, 6);
    expect(grid.maxValue).toBeGreaterThan(0);
  });

  it("scales each point's contribution by a weight accessor when provided", () => {
    const plain = computeKdeGrid(
      layer({ data: [{ x: 60, y: 40 }], resolution: 16, bandwidth: 10 }),
      statsbomb,
    );
    const weighted = computeKdeGrid(
      layer({
        data: [{ x: 60, y: 40, w: 3 }],
        resolution: 16,
        bandwidth: 10,
        weight: (d) => d.w ?? 0,
      }),
      statsbomb,
    );
    expect(weighted.maxValue).toBeCloseTo(plain.maxValue * 3, 6);
  });

  it("ignores points outside the pitch extent", () => {
    const grid = computeKdeGrid(
      layer({
        data: [
          { x: -5, y: 40 },
          { x: 125, y: 40 },
          { x: 60, y: -5 },
          { x: 60, y: 85 },
        ],
        resolution: 16,
      }),
      statsbomb,
    );
    expect(grid.maxValue).toBe(0);
  });

  it("truncates the kernel rather than touching every cell for every point", () => {
    // With a 1-unit bandwidth the 3σ cutoff covers a few cells only; the
    // rest of a 64x64 grid must stay untouched (this is the optimisation
    // that keeps a full match's worth of events tractable).
    const grid = computeKdeGrid(
      layer({ data: [{ x: 60, y: 40 }], resolution: 64, bandwidth: 1 }),
      statsbomb,
    );
    expect(grid.values.filter((v) => v > 0).length).toBeLessThan(40);
  });
});
