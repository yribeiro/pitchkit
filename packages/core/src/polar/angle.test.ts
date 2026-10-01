import { describe, expect, it } from "vitest";
import { axisAngle, polarPoint } from "./angle.js";

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
