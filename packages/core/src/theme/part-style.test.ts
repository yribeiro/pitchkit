import { describe, expect, it } from "vitest";
import { partStyle } from "./part-style.js";

describe("partStyle", () => {
  it("styles the outline with the surface CSS variable and fallback", () => {
    expect(partStyle("outline")).toContain("var(--pitch-surface, #1a472a)");
  });

  it("styles stripes with the stripe CSS variable and no stroke", () => {
    const style = partStyle("stripe");
    expect(style).toContain("var(--pitch-stripe");
    expect(style).toContain("stroke: none");
  });

  it("styles spots (center-spot, penalty-spot) as filled, no stroke", () => {
    for (const part of ["center-spot", "penalty-spot"]) {
      const style = partStyle(part);
      expect(style).toContain("var(--pitch-lines");
      expect(style).toContain("stroke: none");
    }
  });

  it("styles every other part (lines) as unfilled with the lines CSS variable", () => {
    for (const part of ["halfway-line", "penalty-area", "corner-arc", "goal", "goal-box"]) {
      const style = partStyle(part);
      expect(style).toContain("fill: none");
      expect(style).toContain("var(--pitch-lines");
    }
  });
});
