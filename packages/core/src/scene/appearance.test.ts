import { describe, expect, it } from "vitest";
import {
  computeGoalBox,
  computeStripeBands,
  goalBoxDepth,
  pitchGoalBoxDepth,
  resolveStripeCount,
} from "./appearance.js";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { Rect } from "./geometry.js";

describe("resolveStripeCount", () => {
  it("returns 0 for undefined or false", () => {
    expect(resolveStripeCount(undefined)).toBe(0);
    expect(resolveStripeCount(false)).toBe(0);
  });

  it("returns a sensible default for true", () => {
    expect(resolveStripeCount(true)).toBeGreaterThan(0);
  });

  it("floors a fractional count and clamps negative to 0", () => {
    expect(resolveStripeCount(7.9)).toBe(7);
    expect(resolveStripeCount(-3)).toBe(0);
  });
});

describe("computeStripeBands", () => {
  const outline: Rect = { x: 0, y: 0, width: 120, height: 80 };

  it("returns no bands below a count of 2", () => {
    expect(computeStripeBands(outline, 0)).toEqual([]);
    expect(computeStripeBands(outline, 1)).toEqual([]);
  });

  it("returns half the count as painted bands (alternating), each full-height", () => {
    const bands = computeStripeBands(outline, 12);
    expect(bands).toHaveLength(6);
    for (const band of bands) {
      expect(band.y).toBe(0);
      expect(band.height).toBe(80);
      expect(band.width).toBeCloseTo(10, 6); // 120 / 12
    }
  });

  it("positions bands at every-other slot, starting from the outline's left edge", () => {
    const bands = computeStripeBands(outline, 4);
    expect(bands.map((b) => b.x)).toEqual([0, 60]); // slots 0 and 2 of 4 (width 30 each)
  });

  it("offsets correctly when the outline itself isn't at the origin", () => {
    const offsetOutline: Rect = { x: 100, y: 50, width: 40, height: 20 };
    const bands = computeStripeBands(offsetOutline, 4);
    expect(bands[0]?.x).toBe(100);
    expect(bands[0]?.y).toBe(50);
  });
});

describe("goalBoxDepth", () => {
  it("scales linearly off the corner-arc radius", () => {
    expect(goalBoxDepth(1)).toBe(3);
    expect(goalBoxDepth(2)).toBe(6);
  });
});

describe("pitchGoalBoxDepth", () => {
  it("is goalBoxDepth unchanged on a grid in real units", () => {
    expect(pitchGoalBoxDepth(PITCH_DIMENSIONS.uefa)).toBe(3);
    expect(pitchGoalBoxDepth(PITCH_DIMENSIONS.statsbomb)).toBeCloseTo(3.279, 6);
  });

  it("converts metres to x units on a percentage grid", () => {
    // 3 m of a 105 m pitch. Unconverted, this would be three pitch lengths.
    expect(pitchGoalBoxDepth(PITCH_DIMENSIONS.metrica)).toBeCloseTo(3 / 105, 9);
    expect(pitchGoalBoxDepth(PITCH_DIMENSIONS.opta)).toBeCloseTo(300 / 105, 9);
  });
});

describe("computeGoalBox", () => {
  const leftGoal = { from: [0, 36] as const, to: [0, 44] as const };
  const rightGoal = { from: [120, 36] as const, to: [120, 44] as const };

  it("extends outward (negative x) from the left goal line", () => {
    const box = computeGoalBox(leftGoal, true, 5);
    expect(box.x).toBe(-5);
    expect(box.width).toBe(5);
  });

  it("extends outward (positive x) from the right goal line", () => {
    const box = computeGoalBox(rightGoal, false, 5);
    expect(box.x).toBe(120);
    expect(box.width).toBe(5);
  });

  it("matches the goal line's y-span regardless of from/to order", () => {
    const box = computeGoalBox(leftGoal, true, 5);
    expect(box.y).toBe(36);
    expect(box.height).toBe(8);
  });
});
