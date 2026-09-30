import { describe, expect, it } from "vitest";
import { assignLanes } from "./lanes.js";

describe("assignLanes", () => {
  it("keeps well-spaced markers in lane 0", () => {
    expect(assignLanes([0, 30, 60], 16)).toEqual([0, 0, 0]);
  });

  it("fans overlapping markers out into further lanes", () => {
    expect(assignLanes([100, 104, 108], 16)).toEqual([0, 1, 2]);
  });

  it("reuses a lane once its marker is far enough behind", () => {
    // 100 and 104 collide; 130 is clear of both, so it drops back to lane 0.
    expect(assignLanes([100, 104, 130], 16)).toEqual([0, 1, 0]);
  });

  it("returns lanes in the input's order, not sorted order", () => {
    expect(assignLanes([108, 100, 104], 16)).toEqual([2, 0, 1]);
  });

  it("treats exactly the minimum spacing as clear", () => {
    expect(assignLanes([0, 16], 16)).toEqual([0, 0]);
  });

  it("gives identical positions separate lanes, in input order", () => {
    expect(assignLanes([50, 50], 16)).toEqual([0, 1]);
  });

  it("handles no markers", () => {
    expect(assignLanes([], 16)).toEqual([]);
  });

  describe("with a lane cap", () => {
    it("stops opening lanes at the cap", () => {
      const lanes = assignLanes([100, 101, 102, 103, 104], 16, 2);

      expect(Math.max(...lanes)).toBe(1);
    });

    it("joins the lane whose last marker is furthest behind, which overlaps least", () => {
      // Lane 0 last at 100, lane 1 last at 106. A marker at 110 is clear of
      // neither, and 100 is further behind, so it goes to lane 0.
      expect(assignLanes([100, 106, 110], 16, 2)).toEqual([0, 1, 0]);
    });

    it("still prefers a lane that is actually clear", () => {
      expect(assignLanes([100, 104, 130], 16, 2)).toEqual([0, 1, 0]);
    });

    it("treats a cap below one as one", () => {
      expect(assignLanes([10, 11, 12], 16, 0)).toEqual([0, 0, 0]);
    });
  });
});
