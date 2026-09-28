import { describe, expect, it } from "vitest";
import type { Point } from "../transform/types.js";
import { stepAreaPath, stepPath } from "./step-path.js";

describe("stepPath", () => {
  it("holds each value until the next x, then jumps", () => {
    // Step-after: horizontal to the new x first, vertical second. The
    // reverse (step-before) would show the value rising before the event
    // that caused it.
    const points: Point[] = [
      [44, 340],
      [100, 300],
      [200, 250],
    ];

    expect(stepPath(points)).toBe("M44 340 H100 V300 H200 V250");
  });

  it("returns an empty string for no points", () => {
    expect(stepPath([])).toBe("");
  });

  it("emits just a move for a single point", () => {
    expect(stepPath([[44, 340]])).toBe("M44 340");
  });

  it("skips a zero-length horizontal for two events in the same minute", () => {
    const points: Point[] = [
      [44, 340],
      [100, 300],
      [100, 260],
    ];

    expect(stepPath(points)).toBe("M44 340 H100 V300 V260");
  });

  it("skips a zero-length vertical for the full-time anchor", () => {
    // The trailing anchor shares the last real point's y, so it should
    // contribute only its H.
    const points: Point[] = [
      [44, 340],
      [200, 250],
      [624, 250],
    ];

    expect(stepPath(points)).toBe("M44 340 H200 V250 H624");
  });

  it("rounds to two decimals rather than emitting float noise", () => {
    const points: Point[] = [
      [44.123456, 340.987654],
      [100.5, 300.25],
    ];

    expect(stepPath(points)).toBe("M44.12 340.99 H100.5 V300.25");
  });

  it("emits nothing extra for a flat series", () => {
    const points: Point[] = [
      [44, 340],
      [624, 340],
    ];

    expect(stepPath(points)).toBe("M44 340 H624");
  });
});

describe("stepAreaPath", () => {
  it("closes the step down to the baseline", () => {
    const points: Point[] = [
      [44, 340],
      [100, 300],
      [200, 250],
    ];

    expect(stepAreaPath(points, 340)).toBe("M44 340 H100 V300 H200 V250 V340 H44 Z");
  });

  it("returns an empty string for no points", () => {
    expect(stepAreaPath([], 340)).toBe("");
  });

  it("closes a single point back to the baseline", () => {
    expect(stepAreaPath([[44, 300]], 340)).toBe("M44 300 V340 H44 Z");
  });
});
