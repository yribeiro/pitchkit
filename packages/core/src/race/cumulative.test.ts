import { describe, expect, it } from "vitest";
import { computeCumulativeSeries, resolveEndTime, valueAtTime } from "./cumulative.js";

const SHOTS = [
  { time: 7, value: 0.06 },
  { time: 12, value: 0.11 },
  { time: 31, value: 0.44, emphasis: true },
  { time: 78, value: 0.33, emphasis: true },
];

describe("computeCumulativeSeries", () => {
  it("accumulates a running total in time order", () => {
    const { points, total } = computeCumulativeSeries(SHOTS);

    // A running sum of floats does not land on exact decimals, and
    // shouldn't be made to — the error is far below a pixel, and rounding
    // the accumulator would make the total disagree with its own points.
    const expected = [0.06, 0.17, 0.61, 0.94];
    points.forEach((point, i) => {
      expect(point.cumulative).toBeCloseTo(expected[i] as number, 10);
    });
    expect(total).toBeCloseTo(0.94, 10);
  });

  it("sorts unsorted input", () => {
    const { points } = computeCumulativeSeries([
      { time: 78, value: 0.33 },
      { time: 7, value: 0.06 },
      { time: 31, value: 0.44 },
    ]);

    expect(points.map((p) => p.time)).toEqual([7, 31, 78]);
  });

  it("keeps feed order for events in the same minute", () => {
    const { points } = computeCumulativeSeries([
      { time: 45, value: 0.1 },
      { time: 45, value: 0.2 },
    ]);

    expect(points.map((p) => p.value)).toEqual([0.1, 0.2]);
    expect(points.map((p) => p.index)).toEqual([0, 1]);
  });

  it("keeps the caller's original index after sorting", () => {
    // A tooltip looks its datum up by this, so a sorted-away index is a
    // tooltip showing the wrong shot.
    const { points } = computeCumulativeSeries([
      { time: 78, value: 0.33 },
      { time: 7, value: 0.06 },
    ]);

    expect(points.map((p) => p.index)).toEqual([1, 0]);
  });

  it("carries the emphasis flag through, defaulting to false", () => {
    const { points } = computeCumulativeSeries(SHOTS);

    expect(points.map((p) => p.emphasis)).toEqual([false, false, true, true]);
  });

  it("adds no synthetic anchor points", () => {
    // Anchors are a rendering concern. One point per real datum is what
    // lets markers and tooltips map one-to-one.
    const { points } = computeCumulativeSeries(SHOTS);

    expect(points).toHaveLength(SHOTS.length);
  });

  it("handles an empty series", () => {
    const { points, total } = computeCumulativeSeries([]);

    expect(points).toEqual([]);
    expect(total).toBe(0);
  });

  it("handles a single event", () => {
    const { points, total } = computeCumulativeSeries([{ time: 31, value: 0.44 }]);

    expect(points).toHaveLength(1);
    expect(total).toBe(0.44);
  });

  it("handles a series that accumulates nothing", () => {
    const { points, total } = computeCumulativeSeries([
      { time: 10, value: 0 },
      { time: 20, value: 0 },
    ]);

    expect(points.map((p) => p.cumulative)).toEqual([0, 0]);
    expect(total).toBe(0);
  });

  it("accepts an event at kick-off", () => {
    const { points } = computeCumulativeSeries([{ time: 0, value: 0.2 }]);

    expect(points[0]?.time).toBe(0);
    expect(points[0]?.cumulative).toBe(0.2);
  });

  it("drops non-finite events rather than poisoning the running sum", () => {
    // One NaN in a running total corrupts every point after it — a feed
    // with a missing xG should lose that shot, not the rest of the match.
    const { points, total } = computeCumulativeSeries([
      { time: 7, value: 0.06 },
      { time: 20, value: NaN },
      { time: 30, value: 0.1 },
      { time: NaN, value: 0.5 },
    ]);

    expect(points.map((p) => p.time)).toEqual([7, 30]);
    expect(total).toBeCloseTo(0.16, 10);
  });
});

describe("valueAtTime", () => {
  const { points } = computeCumulativeSeries(SHOTS);

  it("returns zero before the first event", () => {
    expect(valueAtTime(points, 0)).toBe(0);
    expect(valueAtTime(points, 6.9)).toBe(0);
  });

  it("includes an event landing exactly on the queried time", () => {
    // Step-after: the jump happens *at* the event's x, so the value at
    // that instant already includes it.
    expect(valueAtTime(points, 7)).toBe(0.06);
    expect(valueAtTime(points, 31)).toBeCloseTo(0.61, 10);
  });

  it("holds the previous total between events", () => {
    expect(valueAtTime(points, 20)).toBeCloseTo(0.17, 10);
    expect(valueAtTime(points, 77.9)).toBeCloseTo(0.61, 10);
  });

  it("returns the final total after the last event", () => {
    expect(valueAtTime(points, 90)).toBeCloseTo(0.94, 10);
    expect(valueAtTime(points, 121)).toBeCloseTo(0.94, 10);
  });

  it("returns zero for an empty series at any time", () => {
    expect(valueAtTime([], 45)).toBe(0);
  });
});

describe("resolveEndTime", () => {
  it("floors a quiet match at 90 rather than the last shot", () => {
    expect(resolveEndTime(84)).toBe(90);
  });

  it("extends past 90 for stoppage time", () => {
    // The Euro 2024 final's last event is at 94'.
    expect(resolveEndTime(94)).toBe(94);
  });

  it("extends through extra time", () => {
    // A knockout match genuinely reaches 121'; a fixed 90 clips it.
    expect(resolveEndTime(120.5)).toBe(121);
  });

  it("accepts a custom minimum", () => {
    expect(resolveEndTime(50, 45)).toBe(50);
    expect(resolveEndTime(30, 45)).toBe(45);
  });

  it("falls back to the minimum for a series with no events", () => {
    expect(resolveEndTime(-Infinity)).toBe(90);
    expect(resolveEndTime(NaN)).toBe(90);
  });
});
