/**
 * The goal-mouth coordinate systems a goal view accepts.
 *
 * This is a different plane from the pitch: lateral position across the
 * goal and height off the ground, as a shot's end location records it. It
 * shares nothing with `dimensions/` (docs/decisions.md D29). StatsBomb's
 * lateral value happens to be the pitch's own `y`, but its height has no
 * pitch equivalent, and other providers use other conventions.
 */
export type GoalFrameId = "statsbomb" | "metric";

export interface GoalFrame {
  readonly id: GoalFrameId;
  /** The lateral coordinate of the middle of the goal. */
  readonly centre: number;
  /** The distance between the posts, in the frame's own units. */
  readonly goalWidth: number;
  /** The height of the crossbar, in the frame's own units. */
  readonly goalHeight: number;
}

/** The goal mouth in metres: 7.32 m between the posts, 2.44 m to the bar (IFAB Law 1). */
export const GOAL_WIDTH_METRES = 7.32;
export const GOAL_HEIGHT_METRES = 2.44;

/**
 * Every frame has lateral values increasing to the shooter's right, so the
 * goal reads as the shooter sees it.
 *
 * - `statsbomb`: a shot's `end_location[1]` and `[2]`, in yards. The posts
 *   are at 36 and 44 and the crossbar at 8 ft (2.67 yd).
 * - `metric`: metres from the middle of the goal and off the ground.
 */
export const GOAL_FRAMES: Readonly<Record<GoalFrameId, GoalFrame>> = {
  statsbomb: { id: "statsbomb", centre: 40, goalWidth: 8, goalHeight: 8 / 3 },
  metric: {
    id: "metric",
    centre: 0,
    goalWidth: GOAL_WIDTH_METRES,
    goalHeight: GOAL_HEIGHT_METRES,
  },
};

/**
 * A frame's coordinates in metres from the middle of the goal line.
 *
 * Each axis is scaled by the frame's own goal, not a unit conversion, so a
 * value on a post or on the bar in the provider's data lands exactly on the
 * drawn post or bar. StatsBomb's 8 yd is 7.315 m, not 7.32.
 */
export function toGoalMetres(frame: GoalFrame, y: number, z: number): [number, number] {
  return [
    ((y - frame.centre) * GOAL_WIDTH_METRES) / frame.goalWidth,
    (z * GOAL_HEIGHT_METRES) / frame.goalHeight,
  ];
}

/** The inverse of {@link toGoalMetres}. */
export function fromGoalMetres(frame: GoalFrame, u: number, h: number): [number, number] {
  return [
    frame.centre + (u * frame.goalWidth) / GOAL_WIDTH_METRES,
    (h * frame.goalHeight) / GOAL_HEIGHT_METRES,
  ];
}
