import { describe, expect, it } from "vitest";
import { getPitchDimensions, PITCH_DIMENSIONS } from "./registry.js";
import type { PitchTypeId } from "./types.js";

// Every registered type, so a new provider is held to the same invariants
// rather than only being covered by its own test file.
const PITCH_TYPES: PitchTypeId[] = ["statsbomb", "opta", "uefa", "skillcorner"];

describe("PITCH_DIMENSIONS", () => {
  it.each(PITCH_TYPES)("%s has a positive extent", (pitchType) => {
    const dims = PITCH_DIMENSIONS[pitchType];
    expect(dims.length).toBeGreaterThan(0);
    expect(dims.width).toBeGreaterThan(0);
  });

  it("statsbomb is a 120x80 grid, top-left origin, y-down, not normalized", () => {
    const dims = PITCH_DIMENSIONS.statsbomb;
    expect(dims.length).toBe(120);
    expect(dims.width).toBe(80);
    expect(dims.origin).toBe("top-left");
    expect(dims.yDirection).toBe("down");
    expect(dims.normalized).toBe(false);
  });

  it("opta is a normalized 100x100 grid, bottom-left origin, y-up", () => {
    const dims = PITCH_DIMENSIONS.opta;
    expect(dims.length).toBe(100);
    expect(dims.width).toBe(100);
    expect(dims.origin).toBe("bottom-left");
    expect(dims.yDirection).toBe("up");
    expect(dims.normalized).toBe(true);
  });

  it("uefa is a 105x68 metric grid, bottom-left origin, y-up, not normalized", () => {
    const dims = PITCH_DIMENSIONS.uefa;
    expect(dims.length).toBe(105);
    expect(dims.width).toBe(68);
    expect(dims.origin).toBe("bottom-left");
    expect(dims.yDirection).toBe("up");
    expect(dims.normalized).toBe(false);
    // UEFA's grid is literally metric: provider units already equal metres.
    expect(dims.length).toBe(dims.realLengthMeters);
    expect(dims.width).toBe(dims.realWidthMeters);
  });

  it.each(PITCH_TYPES)("%s markings are all positive", (pitchType) => {
    const { markings } = PITCH_DIMENSIONS[pitchType];
    for (const [key, value] of Object.entries(markings)) {
      expect(value, `${pitchType}.${key}`).toBeGreaterThan(0);
    }
  });

  it.each(PITCH_TYPES)(
    "%s penalty area is wider than it is long, and bigger than the six-yard box",
    (pitchType) => {
      const { markings } = PITCH_DIMENSIONS[pitchType];
      expect(markings.penaltyAreaWidth).toBeGreaterThan(markings.penaltyAreaLength);
      expect(markings.penaltyAreaLength).toBeGreaterThan(markings.sixYardLength);
      expect(markings.penaltyAreaWidth).toBeGreaterThan(markings.sixYardWidth);
    },
  );

  it.each(PITCH_TYPES)(
    "%s center circle radius converts to a plausible ~9.15m via the length-axis scale",
    (pitchType) => {
      const dims = PITCH_DIMENSIONS[pitchType];
      const lengthScale = dims.realLengthMeters / dims.length;
      const radiusMeters = dims.markings.centerCircleRadius * lengthScale;
      // Generous tolerance: StatsBomb/Opta grids are approximations of the
      // real pitch, not exact per-axis conversions (see PitchMarkings doc).
      expect(radiusMeters).toBeGreaterThan(8);
      expect(radiusMeters).toBeLessThan(10.5);
    },
  );

  it("UEFA's center circle radius is exactly 9.15m (its grid is metric)", () => {
    expect(PITCH_DIMENSIONS.uefa.markings.centerCircleRadius).toBeCloseTo(9.15, 5);
  });
});

describe("getPitchDimensions", () => {
  it.each(PITCH_TYPES)("returns the registry entry for %s", (pitchType) => {
    expect(getPitchDimensions(pitchType)).toBe(PITCH_DIMENSIONS[pitchType]);
  });

  it("throws for an unknown pitch type", () => {
    expect(() => getPitchDimensions("not-a-real-provider" as PitchTypeId)).toThrow();
  });
});
