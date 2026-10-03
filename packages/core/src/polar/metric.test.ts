import { describe, expect, it } from "vitest";
import { normaliseMetric, ringSteps, ringValues } from "./metric.js";

describe("normaliseMetric", () => {
  it("places a value between min and max", () => {
    expect(normaliseMetric(0.3, { min: 0, max: 0.6 })).toEqual({ t: 0.5, clamped: false });
  });

  it("defaults to a 0–100 range", () => {
    expect(normaliseMetric(25, {})).toEqual({ t: 0.25, clamped: false });
  });

  it("flips a lower-is-better axis so the better value is outward", () => {
    expect(normaliseMetric(1, { min: 1, max: 5, lowerIsBetter: true })?.t).toBe(1);
    expect(normaliseMetric(5, { min: 1, max: 5, lowerIsBetter: true })?.t).toBe(0);
  });

  it("clamps to the axis at both ends and says so", () => {
    expect(normaliseMetric(120, {})).toEqual({ t: 1, clamped: true });
    expect(normaliseMetric(-5, {})).toEqual({ t: 0, clamped: true });
  });

  it("returns undefined for a missing or non-finite value", () => {
    expect(normaliseMetric(undefined, {})).toBeUndefined();
    expect(normaliseMetric(null, {})).toBeUndefined();
    expect(normaliseMetric(Number.NaN, {})).toBeUndefined();
    expect(normaliseMetric(Infinity, {})).toBeUndefined();
  });

  it("puts every value on the middle ring for a range with no width", () => {
    expect(normaliseMetric(3, { min: 3, max: 3 })).toEqual({ t: 0.5, clamped: false });
  });
});

describe("ringValues", () => {
  it("runs from min at the centre ring to max at the rim", () => {
    expect(ringValues({ min: 0, max: 4 }, 4)).toEqual([0, 1, 2, 3, 4]);
  });

  it("counts down outwards on a lower-is-better axis", () => {
    expect(ringValues({ min: 1, max: 5, lowerIsBetter: true }, 4)).toEqual([5, 4, 3, 2, 1]);
  });

  it("defaults to 0–100 and treats fewer than one ring as one", () => {
    expect(ringValues({}, 0)).toEqual([0, 100]);
  });
});

describe("ringSteps", () => {
  it("spaces rings + 1 steps evenly, inclusive of both ends", () => {
    expect(ringSteps(10, 50, 4)).toEqual([10, 20, 30, 40, 50]);
  });
});
