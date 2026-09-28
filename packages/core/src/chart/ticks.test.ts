import { describe, expect, it } from "vitest";
import { matchMinuteTicks, niceTicks } from "./ticks.js";

describe("niceTicks", () => {
  it("produces round steps across a typical xG range", () => {
    expect(niceTicks(0, 2)).toEqual([0, 0.5, 1, 1.5, 2]);
  });

  it("keeps steps on the 1-2-5 progression", () => {
    expect(niceTicks(0, 10)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(niceTicks(0, 1)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(niceTicks(0, 50)).toEqual([0, 10, 20, 30, 40, 50]);
  });

  it("does not leak floating point dust into the labels", () => {
    // 0.1 + 0.2 territory: these end up as tick *text*, so a stray
    // 0.30000000000000004 is a visible bug, not an internal rounding one.
    for (const tick of niceTicks(0, 1.4)) {
      expect(String(tick).length).toBeLessThan(6);
    }
  });

  it("honours the requested tick count", () => {
    expect(niceTicks(0, 100, 2).length).toBeLessThanOrEqual(4);
    expect(niceTicks(0, 100, 10).length).toBeGreaterThan(5);
  });

  it("starts at the first round step inside the domain", () => {
    expect(niceTicks(0.3, 1.1)).toEqual([0.4, 0.6, 0.8, 1]);
  });

  it("returns a single tick for a degenerate range", () => {
    expect(niceTicks(0, 0)).toEqual([0]);
    expect(niceTicks(5, 2)).toEqual([5]);
  });

  it("returns nothing for non-finite input", () => {
    expect(niceTicks(NaN, 10)).toEqual([]);
    expect(niceTicks(0, Infinity)).toEqual([]);
  });

  it("falls back to the decade step when the normalised step exceeds 5", () => {
    // rawStep normalises above 5, so the 1-2-5 search misses and the
    // multiple falls through to 10.
    expect(niceTicks(0, 35, 5)).toEqual([0, 10, 20, 30]);
  });

  it("treats a count of zero as one", () => {
    expect(niceTicks(0, 10, 0).length).toBeGreaterThan(0);
  });
});

describe("matchMinuteTicks", () => {
  it("ticks every 15 minutes through a regulation match", () => {
    expect(matchMinuteTicks(90)).toEqual([0, 15, 30, 45, 60, 75, 90]);
  });

  it("extends the same progression through extra time", () => {
    // A knockout match really reaches 121'; the axis continues rather than
    // restarting the clock.
    expect(matchMinuteTicks(121)).toEqual([0, 15, 30, 45, 60, 75, 90, 105, 120]);
  });

  it("stops short rather than overshooting the end", () => {
    expect(matchMinuteTicks(94)).toEqual([0, 15, 30, 45, 60, 75, 90]);
  });

  it("accepts a custom interval", () => {
    expect(matchMinuteTicks(90, 45)).toEqual([0, 45, 90]);
  });

  it("returns nothing for invalid input", () => {
    expect(matchMinuteTicks(-1)).toEqual([]);
    expect(matchMinuteTicks(NaN)).toEqual([]);
    expect(matchMinuteTicks(90, 0)).toEqual([]);
    expect(matchMinuteTicks(90, -5)).toEqual([]);
  });

  it("returns just kick-off for a zero-length axis", () => {
    expect(matchMinuteTicks(0)).toEqual([0]);
  });
});
