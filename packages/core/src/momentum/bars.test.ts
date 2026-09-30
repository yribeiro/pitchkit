import { describe, expect, it } from "vitest";
import { barAtMinute, computeMomentumBars, medianBarWidth } from "./bars.js";

describe("computeMomentumBars", () => {
  it("runs each bar from its minute to the next sample's minute", () => {
    const bars = computeMomentumBars([
      { time: 0, value: 1 },
      { time: 1, value: -2 },
      { time: 2, value: 3 },
    ]);

    expect(bars.map((b) => [b.start, b.end, b.value])).toEqual([
      [0, 1, 1],
      [1, 2, -2],
      [2, 3, 3],
    ]);
  });

  it("draws uneven intervals at their true widths, with no gap or overlap", () => {
    // One-minute samples, then a five-minute one. A fixed-width bar
    // centred on each minute would overlap the first pair and leave a gap
    // after the last.
    const bars = computeMomentumBars([
      { time: 0, value: 1 },
      { time: 1, value: 1 },
      { time: 2, value: 1 },
      { time: 7, value: 1 },
    ]);

    for (let i = 1; i < bars.length; i += 1) {
      expect(bars[i]?.start).toBe(bars[i - 1]?.end);
    }
    expect(bars[2]?.end).toBe(7);
  });

  it("gives the last bar the median interval of the rest", () => {
    const bars = computeMomentumBars([
      { time: 0, value: 1 },
      { time: 2, value: 1 },
      { time: 4, value: 1 },
    ]);

    expect(bars[2]).toMatchObject({ start: 4, end: 6 });
  });

  it("uses the median rather than the mean, so one long gap doesn't inflate it", () => {
    // Gaps 1, 1, 1, 20: the mean is 5.75, the median is 1.
    const bars = computeMomentumBars([
      { time: 0, value: 1 },
      { time: 1, value: 1 },
      { time: 2, value: 1 },
      { time: 3, value: 1 },
      { time: 23, value: 1 },
    ]);

    expect(bars[4]).toMatchObject({ start: 23, end: 24 });
  });

  it("averages the two middle gaps for an even count", () => {
    // Gaps 1 and 3: median 2.
    const bars = computeMomentumBars([
      { time: 0, value: 1 },
      { time: 1, value: 1 },
      { time: 4, value: 1 },
    ]);

    expect(bars[2]).toMatchObject({ start: 4, end: 6 });
  });

  it("gives a lone sample one minute", () => {
    expect(computeMomentumBars([{ time: 10, value: 1 }])).toEqual([
      { start: 10, end: 11, value: 1, index: 0 },
    ]);
  });

  it("handles no samples", () => {
    expect(computeMomentumBars([])).toEqual([]);
  });

  it("sorts unsorted input and keeps each bar's original index", () => {
    // A readout looks its datum up by this, so a sorted-away index is a
    // tooltip about the wrong interval.
    const bars = computeMomentumBars([
      { time: 2, value: 3 },
      { time: 0, value: 1 },
      { time: 1, value: 2 },
    ]);

    expect(bars.map((b) => b.start)).toEqual([0, 1, 2]);
    expect(bars.map((b) => b.index)).toEqual([1, 2, 0]);
  });

  it("keeps the later of two samples at the same minute", () => {
    const bars = computeMomentumBars([
      { time: 5, value: 1 },
      { time: 5, value: 9 },
      { time: 6, value: 2 },
    ]);

    expect(bars.map((b) => b.value)).toEqual([9, 2]);
  });

  it("drops non-finite samples rather than losing the match", () => {
    const bars = computeMomentumBars([
      { time: 0, value: 1 },
      { time: 1, value: NaN },
      { time: NaN, value: 2 },
      { time: 2, value: 3 },
    ]);

    expect(bars.map((b) => b.value)).toEqual([1, 3]);
  });

  it("keeps signed values, since direction is the meaning", () => {
    const bars = computeMomentumBars([
      { time: 0, value: 4 },
      { time: 1, value: -4 },
    ]);

    expect(bars.map((b) => b.value)).toEqual([4, -4]);
  });

  describe("with a period range", () => {
    it("stops the last bar at full time", () => {
      const bars = computeMomentumBars(
        [
          { time: 43, value: 1 },
          { time: 44, value: 1 },
        ],
        { start: 0, end: 45 },
      );

      expect(bars[1]).toMatchObject({ start: 44, end: 45 });
    });

    it("clips a bar that starts before the period", () => {
      const bars = computeMomentumBars(
        [
          { time: 40, value: 1 },
          { time: 50, value: 1 },
        ],
        { start: 45, end: 90 },
      );

      expect(bars[0]).toMatchObject({ start: 45, end: 50 });
    });

    it("drops a bar that falls wholly outside the period", () => {
      const bars = computeMomentumBars(
        [
          { time: 10, value: 1 },
          { time: 20, value: 1 },
          { time: 99, value: 1 },
        ],
        { start: 0, end: 45 },
      );

      expect(bars.map((b) => b.start)).toEqual([10, 20]);
    });
  });
});

describe("barAtMinute", () => {
  const bars = computeMomentumBars([
    { time: 0, value: 1 },
    { time: 1, value: 2 },
    { time: 3, value: 3 },
  ]);

  it("finds the bar covering a minute", () => {
    expect(barAtMinute(bars, 0.5)?.value).toBe(1);
    expect(barAtMinute(bars, 2)?.value).toBe(2);
  });

  it("gives a boundary minute to the bar that starts there", () => {
    // Half-open: a minute exactly on a boundary is in one bar, not two.
    expect(barAtMinute(bars, 1)?.value).toBe(2);
    expect(barAtMinute(bars, 3)?.value).toBe(3);
  });

  it("returns nothing before the first bar or after the last", () => {
    // The last bar is 3 to 4.5: the median of the gaps 1 and 2 is 1.5.
    expect(barAtMinute(bars, -1)).toBeUndefined();
    expect(barAtMinute(bars, 4.5)).toBeUndefined();
    expect(barAtMinute([], 1)).toBeUndefined();
  });

  it("returns nothing in a gap between bars", () => {
    // A feed with a hole in it draws no bar there, so there is no value to
    // report — "no data" is not the same as "level".
    const gappy = computeMomentumBars([{ time: 0, value: 1 }], { start: 0, end: 1 }).concat(
      computeMomentumBars([{ time: 5, value: 2 }]),
    );

    expect(barAtMinute(gappy, 3)).toBeUndefined();
  });
});

describe("medianBarWidth", () => {
  const bar = (start: number, end: number) => ({ start, end, value: 1, index: 0 });

  it("is undefined for no bars", () => {
    expect(medianBarWidth([])).toBeUndefined();
  });

  it("takes the middle width of an odd count", () => {
    expect(medianBarWidth([bar(0, 1), bar(1, 6), bar(6, 8)])).toBe(2);
  });

  it("averages the two middle widths of an even count", () => {
    expect(medianBarWidth([bar(0, 1), bar(1, 3), bar(3, 6), bar(6, 12)])).toBe(2.5);
  });
});
