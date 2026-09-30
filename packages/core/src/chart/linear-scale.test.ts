import { describe, expect, it } from "vitest";
import { createLinearScale } from "./linear-scale.js";

describe("createLinearScale", () => {
  it("maps the domain endpoints onto the range endpoints", () => {
    const scale = createLinearScale([0, 100], [0, 500]);

    expect(scale(0)).toBe(0);
    expect(scale(100)).toBe(500);
    expect(scale(50)).toBe(250);
  });

  it("flips for a y-scale given a reversed range", () => {
    // The whole y-axis inversion, expressed as range order rather than as
    // arithmetic in a component.
    const y = createLinearScale([0, 2], [340, 44]);

    expect(y(0)).toBe(340);
    expect(y(2)).toBe(44);
    expect(y(1)).toBe(192);
  });

  it("extrapolates outside the domain rather than clamping", () => {
    const scale = createLinearScale([0, 10], [0, 100]);

    expect(scale(15)).toBe(150);
    expect(scale(-5)).toBe(-50);
  });

  it("maps everything to the range start when the domain is degenerate", () => {
    // A scoreless match: every cumulative value is 0, so the domain
    // collapses. The line belongs on the baseline, not at NaN.
    const y = createLinearScale([0, 0], [340, 44]);

    expect(y(0)).toBe(340);
    expect(y(1)).toBe(340);
  });

  it("inverts back to the domain", () => {
    const scale = createLinearScale([0, 90], [44, 624]);

    expect(scale.invert(scale(45))).toBeCloseTo(45, 10);
    expect(scale.invert(44)).toBeCloseTo(0, 10);
    expect(scale.invert(624)).toBeCloseTo(90, 10);
  });

  it("inverts a flipped scale", () => {
    const y = createLinearScale([0, 2], [340, 44]);

    expect(y.invert(340)).toBeCloseTo(0, 10);
    expect(y.invert(44)).toBeCloseTo(2, 10);
  });

  it("returns the domain start when inverting a degenerate range", () => {
    const scale = createLinearScale([5, 10], [100, 100]);

    expect(scale.invert(100)).toBe(5);
  });

  it("exposes its domain and range", () => {
    const scale = createLinearScale([0, 90], [44, 624]);

    expect(scale.domain).toEqual([0, 90]);
    expect(scale.range).toEqual([44, 624]);
  });
});
