import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../dimensions/registry.js";
import type { PitchTypeId } from "../dimensions/types.js";
import { fromExtentFrame, toExtentFrame } from "../transform/canonical.js";
import type { PositionalHeatmapLayer } from "../scene/types.js";
import { computePositionalBins, computePositionalZones } from "./positional.js";

const statsbomb = PITCH_DIMENSIONS.statsbomb; // 120 x 80, y-down
const uefa = PITCH_DIMENSIONS.uefa;

function layer(
  overrides: Partial<PositionalHeatmapLayer<{ x: number; y: number; w?: number }>> = {},
) {
  return {
    type: "positionalHeatmap" as const,
    data: [],
    x: (d: { x: number }) => d.x,
    y: (d: { y: number }) => d.y,
    ...overrides,
  };
}

/** Total zone area, used to assert the zones tile the pitch without gaps or overlaps. */
function totalArea(zones: Array<{ width: number; height: number }>): number {
  return zones.reduce((sum, z) => sum + z.width * z.height, 0);
}

describe("computePositionalZones", () => {
  it("produces mplsoccer's 20 zones for the default 'full' layout", () => {
    const zones = computePositionalZones(statsbomb);
    expect(zones).toHaveLength(20);
    expect(zones.map((z) => z.name)).toContain("penalty-left");
    expect(zones.map((z) => z.name)).toContain("penalty-right");
    expect(zones.filter((z) => z.name.startsWith("middle-"))).toHaveLength(6);
  });

  it("tiles the whole pitch exactly in every layout", () => {
    const pitchArea = statsbomb.length * statsbomb.width;
    expect(totalArea(computePositionalZones(statsbomb, "full"))).toBeCloseTo(pitchArea, 6);
    expect(totalArea(computePositionalZones(statsbomb, "horizontal"))).toBeCloseTo(pitchArea, 6);
    expect(totalArea(computePositionalZones(statsbomb, "vertical"))).toBeCloseTo(pitchArea, 6);
  });

  it("derives columns from the penalty areas and halfway line, not even sixths", () => {
    // StatsBomb: penalty area line at 18, halfway at 60 -> midpoint 39.
    const zones = computePositionalZones(statsbomb, "vertical");
    expect(zones.map((z) => z.x)).toEqual([0, 18, 39, 60, 81, 102]);
    expect(zones.map((z) => z.width)).toEqual([18, 21, 21, 21, 21, 18]);
  });

  it("derives bands from the penalty area and six-yard box widths", () => {
    // StatsBomb: width 80, penalty area 44 wide, six-yard box 20 wide.
    const zones = computePositionalZones(statsbomb, "horizontal");
    expect(zones.map((z) => z.y)).toEqual([0, 18, 30, 50, 62]);
    expect(zones.map((z) => z.height)).toEqual([18, 12, 20, 12, 18]);
  });

  it("gives the penalty-area zones the full central height, spanning three bands", () => {
    const penalty = computePositionalZones(statsbomb).find((z) => z.name === "penalty-left");
    expect(penalty).toMatchObject({ x: 0, width: 18, y: 18, height: 44 });
  });

  it("splits the central bands at the penalty-area lines only", () => {
    const middle = computePositionalZones(statsbomb).filter((z) => z.name === "middle-1-1");
    expect(middle[0]).toMatchObject({ x: 18, width: 42 });
  });

  it("names bands from the top of the pitch as displayed, honouring yDirection", () => {
    // StatsBomb is y-down, so the top band starts at y = 0...
    const sbTop = computePositionalZones(statsbomb).find((z) => z.name === "top-1");
    expect(sbTop?.y).toBe(0);
    // ...while UEFA is y-up, so its top band is the one at the far edge.
    const uefaTop = computePositionalZones(uefa).find((z) => z.name === "top-1");
    expect(uefaTop?.y).toBeGreaterThan(uefa.width / 2);
  });

  it("throws nothing and returns one zone per band/column for the reduced layouts", () => {
    expect(computePositionalZones(statsbomb, "horizontal")).toHaveLength(5);
    expect(computePositionalZones(statsbomb, "vertical")).toHaveLength(6);
  });
});

describe("computePositionalBins", () => {
  it("returns one bin per zone, all zero for empty data", () => {
    const bins = computePositionalBins(layer(), statsbomb);
    expect(bins).toHaveLength(20);
    expect(bins.every((b) => b.value === 0)).toBe(true);
  });

  it("counts points into the zone that contains them", () => {
    const data = [
      { x: 5, y: 40 }, // inside the left penalty area -> penalty-left
      { x: 5, y: 40 },
      { x: 115, y: 40 }, // penalty-right
    ];
    const bins = computePositionalBins(layer({ data }), statsbomb);
    expect(bins.find((b) => b.name === "penalty-left")?.value).toBe(2);
    expect(bins.find((b) => b.name === "penalty-right")?.value).toBe(1);
  });

  it("sums a weight accessor per zone when provided", () => {
    const data = [
      { x: 5, y: 40, w: 0.3 },
      { x: 5, y: 40, w: 0.5 },
    ];
    const bins = computePositionalBins(layer({ data, weight: (d) => d.w ?? 0 }), statsbomb);
    expect(bins.find((b) => b.name === "penalty-left")?.value).toBeCloseTo(0.8, 6);
  });

  it("assigns every point to exactly one zone (total = number of points)", () => {
    const data = Array.from({ length: 200 }, (_, i) => ({
      x: ((i * 37) % 1200) / 10,
      y: ((i * 53) % 800) / 10,
    }));
    const bins = computePositionalBins(layer({ data }), statsbomb);
    expect(bins.reduce((sum, b) => sum + b.value, 0)).toBe(data.length);
  });

  it("ignores points outside the pitch extent rather than clamping them", () => {
    const data = [
      { x: -1, y: 40 },
      { x: 121, y: 40 },
      { x: 60, y: -5 },
      { x: 60, y: 85 },
    ];
    const bins = computePositionalBins(layer({ data }), statsbomb);
    expect(bins.every((b) => b.value === 0)).toBe(true);
  });

  it("keeps points exactly on the far edge instead of dropping them", () => {
    const data = [{ x: 120, y: 80 }];
    const bins = computePositionalBins(layer({ data }), statsbomb);
    expect(bins.reduce((sum, b) => sum + b.value, 0)).toBe(1);
  });

  it("bins into the reduced layouts when asked", () => {
    const data = [{ x: 5, y: 40 }];
    const bins = computePositionalBins(layer({ data, layout: "vertical" }), statsbomb);
    expect(bins).toHaveLength(6);
    expect(bins[0]?.value).toBe(1);
  });
});

// Every pitch type, centre-origin SkillCorner included (D6, #90). Zones are
// documented as provider coordinates, so they must sit on the pitch in each
// provider's own frame, and contain the points counted into them.
describe.each(Object.keys(PITCH_DIMENSIONS) as PitchTypeId[])("positional zones on %s", (type) => {
  const dims = PITCH_DIMENSIONS[type];

  it.each(["full", "horizontal", "vertical"] as const)(
    "puts every %s zone on the pitch, in provider coordinates",
    (layout) => {
      for (const zone of computePositionalZones(dims, layout)) {
        for (const corner of [
          [zone.x, zone.y],
          [zone.x + zone.width, zone.y + zone.height],
        ] as const) {
          const [ex, ey] = toExtentFrame(dims, corner);
          expect(ex).toBeGreaterThanOrEqual(-1e-9);
          expect(ex).toBeLessThanOrEqual(dims.length + 1e-9);
          expect(ey).toBeGreaterThanOrEqual(-1e-9);
          expect(ey).toBeLessThanOrEqual(dims.width + 1e-9);
        }
      }
    },
  );

  it("counts each point into the zone that contains it", () => {
    // Inside one penalty area, and near the far flank of the other half.
    const points = [
      fromExtentFrame(dims, [0.05 * dims.length, 0.5 * dims.width]),
      fromExtentFrame(dims, [0.7 * dims.length, 0.03 * dims.width]),
    ].map(([x, y]) => ({ x, y }));
    const bins = computePositionalBins(layer({ data: points }), dims);

    expect(bins.reduce((sum, b) => sum + b.value, 0)).toBe(2);
    for (const point of points) {
      const home = bins.filter(
        (b) =>
          b.value > 0 &&
          point.x >= b.x &&
          point.x <= b.x + b.width &&
          point.y >= b.y &&
          point.y <= b.y + b.height,
      );
      expect(home).toHaveLength(1);
    }
  });
});
