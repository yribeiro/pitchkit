import { describe, expect, it } from "vitest";
import { groupByPeriod, isPeriod } from "./periods.js";

describe("isPeriod", () => {
  it("accepts whole numbers from 1", () => {
    expect(isPeriod(1)).toBe(true);
    expect(isPeriod(5)).toBe(true);
  });

  it("rejects zero, fractions and non-finite values", () => {
    expect(isPeriod(0)).toBe(false);
    expect(isPeriod(1.5)).toBe(false);
    expect(isPeriod(NaN)).toBe(false);
    expect(isPeriod(Infinity)).toBe(false);
  });
});

describe("groupByPeriod", () => {
  it("groups indices by period, in list order", () => {
    expect(groupByPeriod([2, 1, 2, 1])).toEqual([
      [1, 3],
      [0, 2],
    ]);
  });

  it("keeps an empty slot for a period with nothing in it", () => {
    expect(groupByPeriod([1, 3])).toEqual([[0], [], [1]]);
  });

  it("has at least `minimum` groups", () => {
    expect(groupByPeriod([])).toEqual([[], []]);
    expect(groupByPeriod([1], 1)).toEqual([[0]]);
    expect(groupByPeriod([], 4)).toHaveLength(4);
  });

  it("leaves out rows without a usable period", () => {
    expect(groupByPeriod([1, 0, 1.5, NaN, 2])).toEqual([[0], [4]]);
  });
});
