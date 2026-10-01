import { describe, expect, it } from "vitest";
import { axisAngle, nearestAxis, polarPoint } from "./angle.js";

describe("axisAngle", () => {
  it("starts at the top and runs clockwise in equal steps", () => {
    expect(axisAngle(0, 4)).toBe(0);
    expect(axisAngle(1, 4)).toBeCloseTo(Math.PI / 2);
    expect(axisAngle(3, 4)).toBeCloseTo((3 * Math.PI) / 2);
  });

  it("is 0 when there are no axes", () => {
    expect(axisAngle(0, 0)).toBe(0);
  });
});

describe("polarPoint", () => {
  it("puts angle 0 straight up and a quarter turn to the right", () => {
    const [x0, y0] = polarPoint(100, 100, 50, 0);
    expect(x0).toBeCloseTo(100);
    expect(y0).toBeCloseTo(50);
    const [x1, y1] = polarPoint(100, 100, 50, Math.PI / 2);
    expect(x1).toBeCloseTo(150);
    expect(y1).toBeCloseTo(100);
  });
});

describe("nearestAxis", () => {
  it("inverts axisAngle, rounding to the closest axis", () => {
    expect(nearestAxis(0, -10, 4)).toBe(0);
    expect(nearestAxis(10, 0, 4)).toBe(1);
    expect(nearestAxis(0, 10, 4)).toBe(2);
    expect(nearestAxis(-10, 0, 4)).toBe(3);
    // Just left of the top still rounds to axis 0, not the last one.
    expect(nearestAxis(-1, -10, 4)).toBe(0);
  });

  it("is 0 with no axes", () => {
    expect(nearestAxis(5, 5, 0)).toBe(0);
  });
});
