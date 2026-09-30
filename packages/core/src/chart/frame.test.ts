import { describe, expect, it } from "vitest";
import { computeChartFrame } from "./frame.js";

const PADDING = { top: 28, right: 96, bottom: 36, left: 44 };

describe("computeChartFrame", () => {
  it("carves the plot rect out of the outer box", () => {
    const frame = computeChartFrame(720, 380, PADDING);

    expect(frame.x0).toBe(44);
    expect(frame.y0).toBe(28);
    expect(frame.x1).toBe(624);
    expect(frame.y1).toBe(344);
    expect(frame.plotWidth).toBe(580);
    expect(frame.plotHeight).toBe(316);
  });

  it("keeps the outer size", () => {
    const frame = computeChartFrame(720, 380, PADDING);

    expect(frame.width).toBe(720);
    expect(frame.height).toBe(380);
  });

  it("handles zero padding", () => {
    const frame = computeChartFrame(300, 200, { top: 0, right: 0, bottom: 0, left: 0 });

    expect(frame.plotWidth).toBe(300);
    expect(frame.plotHeight).toBe(200);
  });

  it("collapses rather than inverting when padding exceeds the box", () => {
    // A chart in a container narrower than its own padding: the plot area
    // must clamp to zero, not go negative and draw itself inside out.
    const frame = computeChartFrame(50, 40, PADDING);

    expect(frame.plotWidth).toBe(0);
    expect(frame.plotHeight).toBe(0);
    expect(frame.x1).toBeGreaterThanOrEqual(frame.x0);
    expect(frame.y1).toBeGreaterThanOrEqual(frame.y0);
  });

  it("clamps the origin inside a box smaller than its leading padding", () => {
    const frame = computeChartFrame(10, 10, PADDING);

    expect(frame.x0).toBe(10);
    expect(frame.y0).toBe(10);
    expect(frame.plotWidth).toBe(0);
    expect(frame.plotHeight).toBe(0);
  });

  it("handles a zero-sized box", () => {
    const frame = computeChartFrame(0, 0, PADDING);

    expect(frame.plotWidth).toBe(0);
    expect(frame.plotHeight).toBe(0);
  });
});
