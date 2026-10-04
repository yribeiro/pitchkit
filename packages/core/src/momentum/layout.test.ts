import { describe, expect, it } from "vitest";
import {
  minuteToX,
  xToMinute,
  layoutMomentumPanels,
  momentumExtent,
  nominalPeriodRange,
  resolvePeriodRange,
} from "./layout.js";

describe("nominalPeriodRange", () => {
  it("knows regulation time and extra time", () => {
    expect(nominalPeriodRange(0)).toEqual({ start: 0, end: 45 });
    expect(nominalPeriodRange(1)).toEqual({ start: 45, end: 90 });
    expect(nominalPeriodRange(2)).toEqual({ start: 90, end: 105 });
    expect(nominalPeriodRange(3)).toEqual({ start: 105, end: 120 });
  });

  it("continues in 15-minute blocks past extra time", () => {
    expect(nominalPeriodRange(4)).toEqual({ start: 120, end: 135 });
    expect(nominalPeriodRange(5)).toEqual({ start: 135, end: 150 });
  });
});

describe("resolvePeriodRange", () => {
  it("extends a half to its stoppage time", () => {
    // The Euro 2024 final's first half runs to 47'.
    expect(resolvePeriodRange(0, 46.4)).toEqual({ start: 0, end: 47 });
  });

  it("floors at the nominal end, so a quiet half still shows 45", () => {
    expect(resolvePeriodRange(0, 30)).toEqual({ start: 0, end: 45 });
  });

  it("uses the nominal range for a period with no data", () => {
    expect(resolvePeriodRange(1, undefined)).toEqual({ start: 45, end: 90 });
    expect(resolvePeriodRange(1, NaN)).toEqual({ start: 45, end: 90 });
  });
});

describe("layoutMomentumPanels", () => {
  it("lays periods out left to right, separated by the gap", () => {
    const [first, second] = layoutMomentumPanels(
      [
        { start: 0, end: 45 },
        { start: 45, end: 90 },
      ],
      0,
      1010,
      10,
    );

    expect(first?.x0).toBe(0);
    expect(first?.x1).toBe(500);
    expect(second?.x0).toBe(510);
    expect(second?.x1).toBe(1010);
  });

  it("makes a minute the same width in every panel", () => {
    // A half with eight minutes of stoppage is wider, not squeezed.
    const [first, second] = layoutMomentumPanels(
      [
        { start: 0, end: 45 },
        { start: 45, end: 98 },
      ],
      0,
      1000,
      0,
    );

    const perMinute = (p: typeof first) =>
      ((p?.x1 ?? 0) - (p?.x0 ?? 0)) / ((p?.end ?? 0) - (p?.start ?? 0));
    expect(perMinute(first)).toBeCloseTo(perMinute(second), 10);
    expect((second?.x1 ?? 0) - (second?.x0 ?? 0)).toBeGreaterThan(
      (first?.x1 ?? 0) - (first?.x0 ?? 0),
    );
  });

  it("gives each panel a scale from its own minutes to its own pixels", () => {
    const [, second] = layoutMomentumPanels(
      [
        { start: 0, end: 45 },
        { start: 45, end: 90 },
      ],
      0,
      1010,
      10,
    );

    expect(second?.scale(45)).toBe(510);
    expect(second?.scale(90)).toBe(1010);
    expect(second?.scale(67.5)).toBe(760);
  });

  it("handles extra time as further panels", () => {
    const panels = layoutMomentumPanels(
      [0, 1, 2, 3].map((i) => nominalPeriodRange(i)),
      0,
      1000,
      10,
    );

    expect(panels).toHaveLength(4);
    expect(panels[3]?.x1).toBeCloseTo(1000, 10);
  });

  it("splits the width equally when every range is empty", () => {
    const panels = layoutMomentumPanels(
      [
        { start: 0, end: 0 },
        { start: 0, end: 0 },
      ],
      0,
      110,
      10,
    );

    expect(panels[0]?.x1).toBe(50);
    expect(panels[1]?.x0).toBe(60);
  });

  it("collapses rather than going negative when the gaps exceed the width", () => {
    const panels = layoutMomentumPanels(
      [
        { start: 0, end: 45 },
        { start: 45, end: 90 },
      ],
      0,
      5,
      10,
    );

    for (const panel of panels) expect(panel.x1).toBeGreaterThanOrEqual(panel.x0);
  });

  it("returns nothing for no periods", () => {
    expect(layoutMomentumPanels([], 0, 100, 10)).toEqual([]);
  });

  it("carries the index, so a caller can find the period again", () => {
    const panels = layoutMomentumPanels([nominalPeriodRange(0), nominalPeriodRange(1)], 0, 100, 0);

    expect(panels.map((p) => p.index)).toEqual([0, 1]);
  });
});

describe("momentumExtent", () => {
  it("rounds the largest magnitude up to a round number", () => {
    expect(momentumExtent([3, -7, 2])).toBe(8);
  });

  it("is symmetric, taking the larger side's magnitude", () => {
    expect(momentumExtent([-7, 2])).toBe(momentumExtent([7, -2]));
  });

  it("does not shrink below the data", () => {
    const extent = momentumExtent([0.37, -0.12]);

    expect(extent).toBeGreaterThanOrEqual(0.37);
  });

  it("gives an all-zero chart a usable axis", () => {
    expect(momentumExtent([0, 0])).toBe(1);
    expect(momentumExtent([])).toBe(1);
  });

  it("ignores a non-finite value rather than returning NaN", () => {
    expect(momentumExtent([NaN, 3])).toBeGreaterThanOrEqual(3);
    expect(momentumExtent([Infinity])).toBe(1);
  });
});

describe("minuteToX", () => {
  const panels = layoutMomentumPanels(
    [
      { start: 0, end: 45 },
      { start: 45, end: 90 },
    ],
    0,
    200,
    20,
  );
  const [first, second] = panels as [(typeof panels)[number], (typeof panels)[number]];

  it("maps a minute through its period's panel", () => {
    expect(minuteToX(panels, 10, 1)).toBeCloseTo(first.scale(10));
    expect(minuteToX(panels, 60, 2)).toBeCloseTo(second.scale(60));
  });

  it("places a minute in the period it is given, where the periods' minutes overlap", () => {
    // First-half stoppage time runs to 48', and the second half restarts at 45'.
    const overlapping = layoutMomentumPanels(
      [
        { start: 0, end: 48 },
        { start: 45, end: 94 },
      ],
      0,
      200,
      20,
    );
    const [one, two] = overlapping as [(typeof overlapping)[number], (typeof overlapping)[number]];

    expect(minuteToX(overlapping, 46.5, 1)).toBeCloseTo(one.scale(46.5));
    expect(minuteToX(overlapping, 46.5, 2)).toBeCloseTo(two.scale(46.5));
    expect(minuteToX(overlapping, 46.5, 2)).toBeGreaterThan(one.x1);
  });

  it("clamps a minute to its own period's edges", () => {
    expect(minuteToX(panels, -5, 1)).toBeCloseTo(first.scale(0));
    expect(minuteToX(panels, 50, 1)).toBeCloseTo(first.scale(45));
    expect(minuteToX(panels, 120, 2)).toBeCloseTo(second.scale(90));
  });

  it("falls back to the nearest panel by minute for a period it has no panel for", () => {
    expect(minuteToX(panels, 120, 5)).toBeCloseTo(second.scale(90));
    expect(minuteToX(panels, 10, NaN)).toBeCloseTo(first.scale(10));
  });

  it("is 0 with no panels", () => {
    expect(minuteToX([], 10, 1)).toBe(0);
  });
});

describe("xToMinute", () => {
  const panels = layoutMomentumPanels(
    [
      { start: 0, end: 48 },
      { start: 45, end: 94 },
    ],
    0,
    200,
    20,
  );
  const [first, second] = panels as [(typeof panels)[number], (typeof panels)[number]];

  it("reads a pixel back as a period and a minute", () => {
    expect(xToMinute(panels, first.scale(46.5))).toEqual({ period: 1, minute: expect.closeTo(46.5, 6) });
    expect(xToMinute(panels, second.scale(46.5))).toEqual({
      period: 2,
      minute: expect.closeTo(46.5, 6),
    });
  });

  it("is undefined in the gap between periods and outside every panel", () => {
    expect(xToMinute(panels, (first.x1 + second.x0) / 2)).toBeUndefined();
    expect(xToMinute(panels, -10)).toBeUndefined();
    expect(xToMinute(panels, 210)).toBeUndefined();
  });
});
