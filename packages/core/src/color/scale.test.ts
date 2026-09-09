import { describe, expect, it } from "vitest";
import { createColorScale } from "./scale.js";

describe("createColorScale", () => {
  it("maps the minimum value to exactly colorMin", () => {
    const scale = createColorScale(0, 10, "#000000", "#ffffff");
    expect(scale(0)).toBe("rgb(0, 0, 0)");
  });

  it("maps the maximum value to exactly colorMax", () => {
    const scale = createColorScale(0, 10, "#000000", "#ffffff");
    expect(scale(10)).toBe("rgb(255, 255, 255)");
  });

  it("interpolates the midpoint linearly", () => {
    const scale = createColorScale(0, 10, "#000000", "#ffffff");
    expect(scale(5)).toBe("rgb(128, 128, 128)");
  });

  it("interpolates each channel independently for non-grayscale endpoints", () => {
    const scale = createColorScale(0, 100, "#1d4ed8", "#ef4444");
    // r: 29->239, g: 78->68, b: 216->68, at t=0.5
    expect(scale(50)).toBe("rgb(134, 73, 142)");
  });

  it("clamps values below the domain minimum to colorMin", () => {
    const scale = createColorScale(0, 10, "#000000", "#ffffff");
    expect(scale(-100)).toBe("rgb(0, 0, 0)");
  });

  it("clamps values above the domain maximum to colorMax", () => {
    const scale = createColorScale(0, 10, "#000000", "#ffffff");
    expect(scale(1000)).toBe("rgb(255, 255, 255)");
  });

  it("returns colorMin for every value when min === max (zero-range domain)", () => {
    const scale = createColorScale(5, 5, "#000000", "#ffffff");
    expect(scale(5)).toBe("rgb(0, 0, 0)");
    expect(scale(0)).toBe("rgb(0, 0, 0)");
  });

  it("throws for a non-hex color string", () => {
    expect(() => createColorScale(0, 10, "blue", "#ffffff")).toThrow();
  });

  it("is case-insensitive for hex digits", () => {
    const scale = createColorScale(0, 10, "#ABCDEF", "#ffffff");
    expect(scale(0)).toBe("rgb(171, 205, 239)");
  });
});
