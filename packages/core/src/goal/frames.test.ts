import { describe, expect, it } from "vitest";
import {
  GOAL_FRAMES,
  GOAL_HEIGHT_METRES,
  GOAL_WIDTH_METRES,
  fromGoalMetres,
  toGoalMetres,
} from "./frames.js";
import type { GoalFrameId } from "./frames.js";

const FRAME_IDS = Object.keys(GOAL_FRAMES) as GoalFrameId[];

describe("goal frames", () => {
  it("keys every frame by its own id", () => {
    for (const id of FRAME_IDS) expect(GOAL_FRAMES[id].id).toBe(id);
  });

  it.each(FRAME_IDS)("%s: the posts and bar land on the real goal", (id) => {
    const frame = GOAL_FRAMES[id];
    const left = frame.centre - frame.goalWidth / 2;
    const right = frame.centre + frame.goalWidth / 2;
    expect(toGoalMetres(frame, left, 0)[0]).toBeCloseTo(-GOAL_WIDTH_METRES / 2, 10);
    expect(toGoalMetres(frame, right, 0)[0]).toBeCloseTo(GOAL_WIDTH_METRES / 2, 10);
    expect(toGoalMetres(frame, frame.centre, frame.goalHeight)).toEqual([0, GOAL_HEIGHT_METRES]);
  });

  it.each(FRAME_IDS)("%s: fromGoalMetres inverts toGoalMetres", (id) => {
    const frame = GOAL_FRAMES[id];
    const [u, h] = toGoalMetres(frame, frame.centre + 1.3, 0.7);
    const [y, z] = fromGoalMetres(frame, u, h);
    expect(y).toBeCloseTo(frame.centre + 1.3, 10);
    expect(z).toBeCloseTo(0.7, 10);
  });

  it("statsbomb: posts at 36 and 44 yards, bar at 8 ft", () => {
    const frame = GOAL_FRAMES.statsbomb;
    expect(toGoalMetres(frame, 36, 0)[0]).toBeCloseTo(-3.66, 10);
    expect(toGoalMetres(frame, 44, 0)[0]).toBeCloseTo(3.66, 10);
    expect(toGoalMetres(frame, 40, 8 / 3)[1]).toBeCloseTo(2.44, 10);
  });

  it("statsbomb: a smaller y is to the shooter's left", () => {
    expect(toGoalMetres(GOAL_FRAMES.statsbomb, 37, 1)[0]).toBeLessThan(0);
  });

  it("metric: is already metres from the middle", () => {
    expect(toGoalMetres(GOAL_FRAMES.metric, -1.5, 2)).toEqual([-1.5, 2]);
  });
});
