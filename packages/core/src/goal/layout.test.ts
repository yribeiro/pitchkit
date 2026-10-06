import { describe, expect, it } from "vitest";
import { GOAL_FRAMES } from "./frames.js";
import {
  GOAL_CAMERA_DISTANCE,
  GOAL_VIEW_ASPECT,
  GOAL_VIEW_GROUND,
  GOAL_VIEW_HALF_WIDTH,
  GOAL_VIEW_TOP,
  computeGoalLayout,
  goalPlaneToPixel,
  goalPoint,
  projectGround,
} from "./layout.js";

describe("computeGoalLayout", () => {
  it("fills a box of the view's own aspect exactly", () => {
    const width = 1000;
    const layout = computeGoalLayout(width, width / GOAL_VIEW_ASPECT);
    expect(layout.left).toBeCloseTo(0, 10);
    expect(layout.top).toBeCloseTo(0, 10);
    expect(layout.width).toBeCloseTo(1000, 10);
    expect(layout.scale).toBeCloseTo(1000 / (2 * GOAL_VIEW_HALF_WIDTH), 10);
    expect(layout.centreX).toBeCloseTo(500, 10);
    expect(layout.groundY).toBeCloseTo(GOAL_VIEW_TOP * layout.scale, 10);
  });

  it("centres horizontally in a box too wide", () => {
    const layout = computeGoalLayout(1000, 200);
    expect(layout.top).toBeCloseTo(0, 10);
    expect(layout.height).toBeCloseTo(200, 10);
    expect(layout.left).toBeGreaterThan(0);
    expect(layout.left * 2 + layout.width).toBeCloseTo(1000, 10);
  });

  it("centres vertically in a box too tall", () => {
    const layout = computeGoalLayout(400, 400);
    expect(layout.left).toBeCloseTo(0, 10);
    expect(layout.top).toBeGreaterThan(0);
    expect(layout.top * 2 + layout.height).toBeCloseTo(400, 10);
    expect(layout.height).toBeCloseTo((GOAL_VIEW_TOP + GOAL_VIEW_GROUND) * layout.scale, 10);
  });
});

describe("goalPlaneToPixel", () => {
  it("puts the middle of the goal line at the centre of the ground line, height up", () => {
    const layout = computeGoalLayout(1000, 400);
    expect(goalPlaneToPixel(layout, 0, 0)).toEqual([layout.centreX, layout.groundY]);
    const [x, y] = goalPlaneToPixel(layout, 1, 1);
    expect(x).toBeCloseTo(layout.centreX + layout.scale, 10);
    expect(y).toBeCloseTo(layout.groundY - layout.scale, 10);
  });
});

describe("projectGround", () => {
  const layout = computeGoalLayout(1000, 400);

  it("is the goal plane on the goal line", () => {
    expect(projectGround(layout, 2, 0)).toEqual(goalPlaneToPixel(layout, 2, 0));
  });

  it("draws nearer ground lower and wider", () => {
    const [x5, y5] = projectGround(layout, 2, 5) as [number, number];
    const [x11, y11] = projectGround(layout, 2, 11) as [number, number];
    expect(y5).toBeGreaterThan(layout.groundY);
    expect(y11).toBeGreaterThan(y5);
    expect(x11).toBeGreaterThan(x5);
    expect(x5).toBeGreaterThan(layout.centreX + 2 * layout.scale);
  });

  it("puts the penalty spot inside the ground strip", () => {
    const [, y] = projectGround(layout, 0, 11) as [number, number];
    expect(y).toBeLessThan(layout.top + layout.height);
  });

  it("has no projection at or behind the camera", () => {
    expect(projectGround(layout, 0, GOAL_CAMERA_DISTANCE)).toBeUndefined();
    expect(projectGround(layout, 0, GOAL_CAMERA_DISTANCE + 1)).toBeUndefined();
  });
});

describe("goalPoint", () => {
  const layout = computeGoalLayout(1000, 400);
  const frame = GOAL_FRAMES.statsbomb;

  it("places a shot in the goal mouth without clamping", () => {
    const point = goalPoint(layout, frame, 40, 4 / 3);
    expect(point?.clamped).toBe(false);
    expect(point?.x).toBeCloseTo(layout.centreX, 10);
    expect(point?.y).toBeCloseTo(layout.groundY - 1.22 * layout.scale, 10);
  });

  it("pins a shot wide of the view to its edge", () => {
    const point = goalPoint(layout, frame, 57, 1);
    expect(point?.clamped).toBe(true);
    expect(point?.x).toBeCloseTo(layout.left + layout.width, 10);
  });

  it("pins a shot above the view to its top", () => {
    const point = goalPoint(layout, frame, 40, 7);
    expect(point?.clamped).toBe(true);
    expect(point?.y).toBeCloseTo(layout.top, 10);
  });

  it("pins inside the edge by an inset, so a mark stays whole", () => {
    const wide = goalPoint(layout, frame, 20, 1, 6);
    expect(wide?.clamped).toBe(true);
    expect(wide?.x).toBeCloseTo(layout.left + 6, 10);
    const high = goalPoint(layout, frame, 40, 9, 6);
    expect(high?.y).toBeCloseTo(layout.top + 6, 10);
    expect(goalPoint(layout, frame, 40, 1, 6)?.clamped).toBe(false);
  });

  it("pins a height below the ground to the ground", () => {
    const point = goalPoint(layout, GOAL_FRAMES.metric, 0, -0.5);
    expect(point?.clamped).toBe(true);
    expect(point?.y).toBeCloseTo(layout.groundY, 10);
  });

  it.each([
    [undefined, 1],
    [null, 1],
    [Number.NaN, 1],
    [40, undefined],
    [40, null],
    [40, Number.POSITIVE_INFINITY],
  ])("draws nothing for a missing coordinate (%s, %s)", (y, z) => {
    expect(goalPoint(layout, frame, y, z)).toBeUndefined();
  });
});
