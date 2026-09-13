import { describe, expect, it } from "vitest";
import { computeHeatmapBins } from "../heatmap/bins.js";
import { computeHexBins } from "../hexbin/bins.js";
import { computeKdeGrid } from "../kde/density.js";
import { computePositionalBins } from "../heatmap/positional.js";
import { computePitchGeometry } from "../scene/geometry.js";
import { fromExtentFrame, toCanonicalFrame, toExtentFrame } from "../transform/canonical.js";
import { createPixelTransform } from "../transform/pixel-transform.js";
import { cropForHalf } from "../transform/half.js";
import { getPitchDimensions } from "./registry.js";
import type { PitchTypeId } from "./types.js";

const CORNER_ORIGIN: PitchTypeId[] = ["statsbomb", "opta", "uefa"];
const skillcorner = getPitchDimensions("skillcorner");

describe("the extent frame", () => {
  it("is an identity for every corner-origin provider", () => {
    // The whole design rests on this: existing pitch types must not move by a
    // single unit, so the conversion has to be a no-op for them.
    for (const type of CORNER_ORIGIN) {
      const dimensions = getPitchDimensions(type);
      for (const point of [
        [0, 0],
        [dimensions.length, dimensions.width],
        [17.3, 4.9],
      ] as const) {
        expect(toExtentFrame(dimensions, point)).toEqual([point[0], point[1]]);
        expect(fromExtentFrame(dimensions, point)).toEqual([point[0], point[1]]);
      }
    }
  });

  it("shifts a center-origin grid onto 0..length / 0..width", () => {
    expect(toExtentFrame(skillcorner, [0, 0])).toEqual([52.5, 34]);
    expect(toExtentFrame(skillcorner, [-52.5, -34])).toEqual([0, 0]);
    expect(toExtentFrame(skillcorner, [52.5, 34])).toEqual([105, 68]);
  });

  it("round-trips", () => {
    const point = [-12.25, 7.5] as const;
    expect(fromExtentFrame(skillcorner, toExtentFrame(skillcorner, point))).toEqual([
      point[0],
      point[1],
    ]);
  });
});

describe("skillcorner dimensions", () => {
  it("is metres from the centre spot, y toward the attacker's left", () => {
    expect(skillcorner.origin).toBe("center");
    expect(skillcorner.yDirection).toBe("up");
    expect(skillcorner.normalized).toBe(false);
    expect([skillcorner.length, skillcorner.width]).toEqual([105, 68]);
  });

  it("puts the centre spot at (0, 0) and a corner at (-52.5, -34)", () => {
    // y is up, so canonical y (which runs downward) inverts.
    expect(toCanonicalFrame(skillcorner, [0, 0])).toEqual([52.5, 34]);
    expect(toCanonicalFrame(skillcorner, [-52.5, -34])).toEqual([0, 68]);
    expect(toCanonicalFrame(skillcorner, [52.5, 34])).toEqual([105, 0]);
  });

  it("draws the centre spot in the middle of the viewport", () => {
    const transform = createPixelTransform(skillcorner, {
      width: 1050,
      height: 680,
      orientation: "horizontal",
    });
    const [px, py] = transform.toPixel([0, 0]);
    expect(px).toBeCloseTo(525, 6);
    expect(py).toBeCloseTo(340, 6);
  });

  it("maps the pitch corners to the viewport corners", () => {
    const transform = createPixelTransform(skillcorner, {
      width: 1050,
      height: 680,
      orientation: "horizontal",
    });
    // y up: provider (-52.5, -34) is bottom-left, so it draws bottom-left.
    expect(transform.toPixel([-52.5, -34]).map(Math.round)).toEqual([0, 680]);
    expect(transform.toPixel([52.5, 34]).map(Math.round)).toEqual([1050, 0]);
  });

  it("round-trips through toProvider", () => {
    const transform = createPixelTransform(skillcorner, {
      width: 800,
      height: 520,
      orientation: "horizontal",
    });
    const [x, y] = transform.toProvider(transform.toPixel([-20, 11]));
    expect(x).toBeCloseTo(-20, 6);
    expect(y).toBeCloseTo(11, 6);
  });
});

describe("pitch geometry on a center-origin grid", () => {
  const geometry = computePitchGeometry(skillcorner);

  it("centres the halfway line on x = 0, not on x = length/2", () => {
    expect(geometry.halfwayLine.from[0]).toBe(0);
    expect(geometry.centerSpot).toEqual([0, 0]);
    expect(geometry.centerCircle.center).toEqual([0, 0]);
  });

  it("starts the outline at the negative corner", () => {
    expect(geometry.outline).toEqual({ x: -52.5, y: -34, width: 105, height: 68 });
  });

  it("puts the goals on the goal lines and the boxes inside them", () => {
    const [left, right] = geometry.goals;
    expect(left.from[0]).toBe(-52.5);
    expect(right.from[0]).toBe(52.5);

    const [leftBox, rightBox] = geometry.penaltyAreas;
    expect(leftBox.x).toBe(-52.5);
    expect(rightBox.x).toBeCloseTo(52.5 - 16.5, 6);
  });

  it("anchors each corner arc to its own corner", () => {
    const corners = geometry.cornerArcs.map((arc) => arc.center);
    expect(corners).toEqual([
      [-52.5, -34],
      [52.5, -34],
      [-52.5, 34],
      [52.5, 34],
    ]);
  });
});

describe("cropForHalf on a center-origin grid", () => {
  it("crops to the attacking half in provider coordinates", () => {
    expect(cropForHalf(skillcorner)).toEqual({ x0: 0, y0: -34, x1: 52.5, y1: 34 });
  });

  it("is unchanged for corner-origin providers", () => {
    const uefa = getPitchDimensions("uefa");
    expect(cropForHalf(uefa)).toEqual({ x0: 52.5, y0: 0, x1: 105, y1: 68 });
  });
});

describe("density layers over center-origin data", () => {
  // Four points, one per quadrant, all comfortably inside the pitch. Before
  // the extent-frame conversion the two with negative x were silently
  // discarded, which is the bug these guard.
  const data = [
    { x: -30, y: -20 },
    { x: -30, y: 20 },
    { x: 30, y: -20 },
    { x: 30, y: 20 },
  ];
  const accessors = { data, x: (d: { x: number }) => d.x, y: (d: { y: number }) => d.y };

  it("keeps every point in a heatmap", () => {
    const bins = computeHeatmapBins({ type: "heatmap", ...accessors }, skillcorner);
    expect(bins.reduce((sum, bin) => sum + bin.value, 0)).toBe(4);
  });

  it("keeps every point in a hexbin", () => {
    const bins = computeHexBins({ type: "hexbin", ...accessors }, skillcorner);
    expect(bins.reduce((sum, bin) => sum + bin.value, 0)).toBe(4);
  });

  it("keeps every point in a KDE", () => {
    const grid = computeKdeGrid({ type: "kde", ...accessors }, skillcorner);
    expect(grid.maxValue).toBeGreaterThan(0);
  });

  it("keeps every point in positional zones", () => {
    const bins = computePositionalBins({ type: "positionalHeatmap", ...accessors }, skillcorner);
    expect(bins.reduce((sum, bin) => sum + bin.value, 0)).toBe(4);
  });

  it("emits heatmap bins back in provider coordinates", () => {
    const bins = computeHeatmapBins({ type: "heatmap", ...accessors }, skillcorner);
    const xs = bins.map((bin) => bin.x);
    expect(Math.min(...xs)).toBe(-52.5);
    expect(Math.max(...xs)).toBeLessThan(52.5);
  });
});

describe("per-match dimension overrides", () => {
  it("returns the shared instance when nothing changes", () => {
    expect(getPitchDimensions("skillcorner", { length: 105 })).toBe(skillcorner);
    expect(getPitchDimensions("skillcorner")).toBe(skillcorner);
  });

  it("resizes the pitch but not its markings", () => {
    const big = getPitchDimensions("skillcorner", { length: 106, width: 68 });
    expect(big.length).toBe(106);
    // A penalty area is 16.5 m deep on any pitch.
    expect(big.markings).toEqual(skillcorner.markings);

    const geometry = computePitchGeometry(big);
    expect(geometry.outline).toEqual({ x: -53, y: -34, width: 106, height: 68 });
    expect(geometry.penaltyAreas[0].x).toBe(-53);
    expect(geometry.penaltyAreas[0].width).toBe(16.5);
  });

  it("refuses to resize a normalized grid, where extent has no meaning", () => {
    expect(() => getPitchDimensions("opta", { length: 105, width: 68 })).toThrow(/normalized/);
  });

  it("rejects nonsense dimensions", () => {
    expect(() => getPitchDimensions("skillcorner", { length: 0 })).toThrow(/positive/);
    expect(() => getPitchDimensions("skillcorner", { width: Number.NaN })).toThrow(/positive/);
  });
});
