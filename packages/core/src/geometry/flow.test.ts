import { describe, expect, it } from "vitest";
import { computeFlowBins } from "./flow.js";
import { PITCH_DIMENSIONS, getPitchDimensions } from "../dimensions/registry.js";
import type { PitchTypeId } from "../dimensions/types.js";
import { fromExtentFrame, toExtentFrame } from "../transform/canonical.js";

const dimensions = getPitchDimensions("statsbomb");

describe("computeFlowBins", () => {
  it("produces one bin for a single vector", () => {
    const bins = computeFlowBins([{ x: 10, y: 10, x2: 20, y2: 20 }], 6, 5, dimensions);
    expect(bins).toHaveLength(1);
    expect(bins[0]?.count).toBe(1);
    expect(bins[0]?.x2).toBeCloseTo(20, 6);
    expect(bins[0]?.y2).toBeCloseTo(20, 6);
  });

  it("averages end points for multiple vectors landing in the same bin", () => {
    const bins = computeFlowBins(
      [
        { x: 10, y: 10, x2: 20, y2: 20 },
        { x: 11, y: 11, x2: 40, y2: 60 },
      ],
      6,
      5,
      dimensions,
    );
    expect(bins).toHaveLength(1);
    expect(bins[0]?.count).toBe(2);
    expect(bins[0]?.x2).toBeCloseTo(30, 6);
    expect(bins[0]?.y2).toBeCloseTo(40, 6);
  });

  it("ignores vectors whose start point is outside the pitch extent", () => {
    const bins = computeFlowBins([{ x: -5, y: 10, x2: 20, y2: 20 }], 6, 5, dimensions);
    expect(bins).toHaveLength(0);
  });

  it("omits empty bins", () => {
    const bins = computeFlowBins([{ x: 5, y: 5, x2: 10, y2: 10 }], 6, 5, dimensions);
    expect(bins.length).toBeLessThan(6 * 5);
  });

  it("separates vectors into different bins by start location", () => {
    const bins = computeFlowBins(
      [
        { x: 5, y: 5, x2: 10, y2: 10 },
        { x: 100, y: 70, x2: 110, y2: 75 },
      ],
      6,
      5,
      dimensions,
    );
    expect(bins).toHaveLength(2);
  });
});

// Every pitch type, centre-origin SkillCorner included (D6, #90). Points are
// placed as fractions of the pitch in the extent frame and converted to each
// provider's own coordinates, so the same physical pass is tested everywhere.
describe.each(Object.keys(PITCH_DIMENSIONS) as PitchTypeId[])("computeFlowBins on %s", (type) => {
  const dims = PITCH_DIMENSIONS[type];
  const at = (fx: number, fy: number) => fromExtentFrame(dims, [fx * dims.length, fy * dims.width]);
  const pass = (fx: number, fy: number) => {
    const [x, y] = at(fx, fy);
    const [x2, y2] = at(fx + 0.05, fy);
    return { x, y, x2, y2 };
  };

  it("keeps a vector starting in each quadrant", () => {
    const bins = computeFlowBins(
      [pass(0.25, 0.25), pass(0.75, 0.25), pass(0.25, 0.75), pass(0.75, 0.75)],
      2,
      2,
      dims,
    );

    expect(bins).toHaveLength(4);
  });

  it("starts each arrow at its cell's centre, in provider coordinates", () => {
    const bins = computeFlowBins([pass(0.1, 0.1), pass(0.9, 0.9)], 2, 2, dims);
    const starts = bins
      .map((b) => toExtentFrame(dims, [b.x, b.y]))
      .map(([x, y]) => [x / dims.length, y / dims.width])
      .sort((a, b) => (a[0] as number) - (b[0] as number));

    expect(starts[0]?.[0]).toBeCloseTo(0.25, 6);
    expect(starts[0]?.[1]).toBeCloseTo(0.25, 6);
    expect(starts[1]?.[0]).toBeCloseTo(0.75, 6);
    expect(starts[1]?.[1]).toBeCloseTo(0.75, 6);
  });

  it("averages end points in provider coordinates", () => {
    const one = pass(0.1, 0.1);
    const [bin] = computeFlowBins([one], 2, 2, dims);

    expect(bin?.x2).toBeCloseTo(one.x2, 6);
    expect(bin?.y2).toBeCloseTo(one.y2, 6);
  });

  it("drops a vector that starts off the pitch", () => {
    const [x, y] = at(1.1, 0.5);
    expect(computeFlowBins([{ x, y, x2: x, y2: y }], 2, 2, dims)).toHaveLength(0);
  });
});
