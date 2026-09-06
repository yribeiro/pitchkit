import { describe, expect, it } from "vitest";
import { computeFlowBins } from "./flow.js";
import { getPitchDimensions } from "../dimensions/registry.js";

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
    const bins = computeFlowBins(
      [{ x: -5, y: 10, x2: 20, y2: 20 }],
      6,
      5,
      dimensions,
    );
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
