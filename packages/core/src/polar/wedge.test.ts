import { describe, expect, it } from "vitest";
import {
  annularSectorPath,
  overlayOrder,
  splitWedge,
  valueBoxSpot,
  wedgeAngles,
  wedgeLane,
  wedgeMid,
} from "./wedge.js";

const QUARTER = Math.PI / 2;

describe("wedgeAngles", () => {
  it("starts each slice on its axis angle and runs to the next", () => {
    expect(wedgeAngles(1, 4)).toEqual({ start: QUARTER, end: 2 * QUARTER });
  });

  it("insets both edges by the gap", () => {
    const { start, end } = wedgeAngles(0, 4, 0.1);
    expect(start).toBeCloseTo(0.1);
    expect(end).toBeCloseTo(QUARTER - 0.1);
  });

  it("collapses to the middle rather than inverting when the gap is too wide", () => {
    const { start, end } = wedgeAngles(0, 4, 5);
    expect(start).toBeCloseTo(QUARTER / 2);
    expect(end).toBeCloseTo(QUARTER / 2);
  });
});

describe("splitWedge", () => {
  const wedge = { start: 0, end: 1.2 };

  it("splits into equal sub-wedges", () => {
    const parts = splitWedge(wedge, 3);
    expect(parts.map((p) => [p.start, p.end].map((v) => +v.toFixed(2)))).toEqual([
      [0, 0.4],
      [0.4, 0.8],
      [0.8, 1.2],
    ]);
  });

  it("insets each sub-wedge by the gap", () => {
    const [first] = splitWedge(wedge, 2, 0.05);
    expect(first?.start).toBeCloseTo(0.05);
    expect(first?.end).toBeCloseTo(0.55);
  });

  it("treats fewer than one part as one, and caps the gap at half a part", () => {
    expect(splitWedge(wedge, 0)).toEqual([wedge]);
    const [only] = splitWedge(wedge, 1, 9);
    expect(only?.start).toBeCloseTo(0.6);
    expect(only?.end).toBeCloseTo(0.6);
  });
});

describe("annularSectorPath", () => {
  it("draws the outer arc clockwise, then back along the inner one", () => {
    const d = annularSectorPath(0, 0, 5, 10, { start: 0, end: QUARTER });
    expect(d).toBe("M0 -10A10 10 0 0 1 10 0L5 0A5 5 0 0 0 0 -5Z");
  });

  it("sets the large-arc flag past half a turn", () => {
    const d = annularSectorPath(0, 0, 5, 10, { start: 0, end: 4 });
    expect(d).toContain("A10 10 0 1 1");
    expect(d).toContain("A5 5 0 1 0");
  });
});

describe("overlayOrder", () => {
  it("draws the largest first so smaller slices sit on top", () => {
    expect(overlayOrder([40, 90, 60])).toEqual([1, 2, 0]);
  });

  it("keeps series order for ties and leaves out missing values", () => {
    expect(overlayOrder([50, undefined, 50])).toEqual([0, 2]);
  });
});

describe("wedgeMid and wedgeLane", () => {
  const wedge = { start: 1, end: 2 };

  it("finds the middle, and a lane's centre across the wedge", () => {
    expect(wedgeMid(wedge)).toBe(1.5);
    expect(wedgeLane(wedge, 0, 2)).toBe(1.25);
    expect(wedgeLane(wedge, 1, 2)).toBe(1.75);
  });
});

describe("valueBoxSpot", () => {
  const wedge = { start: 0, end: 0.5 };

  it("sits just inside the tip", () => {
    expect(valueBoxSpot(wedge, 0.25, 100, 20, 13)).toEqual({ angle: 0.25, radius: 89 });
  });

  it("stays clear of the hole on a short slice", () => {
    expect(valueBoxSpot(wedge, 0.25, 25, 20, 13)?.radius).toBe(33);
  });

  it("drops the box when the arc is below the minimum", () => {
    expect(valueBoxSpot(wedge, 0.25, 100, 20, 13, 100)).toBeUndefined();
    expect(valueBoxSpot(wedge, 0.25, 100, 20, 13, 40)).toBeDefined();
  });
});
