import { describe, expect, it } from "vitest";
import { computeGoalAngle, selectGoal } from "./goal-angle.js";
import type { Line } from "../scene/geometry.js";

describe("computeGoalAngle", () => {
  it("is π when standing exactly between the two posts on the goal line", () => {
    const angle = computeGoalAngle([0, 5], [0, 0], [0, 10]);
    expect(angle).toBeCloseTo(Math.PI, 6);
  });

  it("shrinks toward 0 as the point moves far away, centered on the goal", () => {
    const near = computeGoalAngle([50, 40], [0, 35], [0, 45]);
    const far = computeGoalAngle([500, 40], [0, 35], [0, 45]);
    expect(far).toBeLessThan(near);
  });

  it("computes a known right angle for a symmetric setup", () => {
    // Standing at (5, 0), posts at (0, 5) and (10, 5): two legs of length
    // sqrt(50) each, perpendicular to each other (right angle at the point).
    const angle = computeGoalAngle([5, 0], [0, 5], [10, 5]);
    expect(angle).toBeCloseTo(Math.PI / 2, 6);
  });

  it("is symmetric regardless of post order", () => {
    const a = computeGoalAngle([50, 40], [0, 35], [0, 45]);
    const b = computeGoalAngle([50, 40], [0, 45], [0, 35]);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe("selectGoal", () => {
  const left: Line = { from: [0, 30], to: [0, 50] };
  const right: Line = { from: [120, 30], to: [120, 50] };
  const goals: readonly [Line, Line] = [left, right];

  it("returns the explicitly requested side regardless of point position", () => {
    expect(selectGoal([100, 40], goals, "left")).toBe(left);
    expect(selectGoal([10, 40], goals, "right")).toBe(right);
  });

  it("picks the nearer goal by distance to its midpoint", () => {
    expect(selectGoal([10, 40], goals, "nearest")).toBe(left);
    expect(selectGoal([100, 40], goals, "nearest")).toBe(right);
  });
});
