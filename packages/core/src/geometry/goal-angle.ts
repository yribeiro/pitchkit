import type { Point } from "../transform/types.js";
import type { Line } from "../scene/geometry.js";

/**
 * The angle subtended at `point` by the segment `post1`-`post2` (e.g. a
 * goal mouth), in radians, always in `[0, π]`. Works in either provider or
 * pixel coordinates — the trig is invariant to the caller's space, unlike
 * `arcSweepFlag`'s sweep direction, which does depend on it.
 */
export function computeGoalAngle(point: Point, post1: Point, post2: Point): number {
  const angle1 = Math.atan2(post1[1] - point[1], post1[0] - point[0]);
  const angle2 = Math.atan2(post2[1] - point[1], post2[0] - point[0]);
  let delta = angle1 - angle2;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  return Math.abs(delta);
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/**
 * Picks which of the pitch's two goals (`computePitchGeometry(dimensions).goals`)
 * a goal-angle mark should measure against. `"nearest"` compares distance
 * from `point` to each goal's midpoint — the usual default, since a shot's
 * angle is normally read against the goal it's aimed at, not a fixed side.
 */
export function selectGoal(
  point: Point,
  goals: readonly [Line, Line],
  which: "left" | "right" | "nearest",
): Line {
  const [left, right] = goals;
  if (which === "left") return left;
  if (which === "right") return right;

  const leftMid: Point = [(left.from[0] + left.to[0]) / 2, (left.from[1] + left.to[1]) / 2];
  const rightMid: Point = [(right.from[0] + right.to[0]) / 2, (right.from[1] + right.to[1]) / 2];
  return distanceSquared(point, leftMid) <= distanceSquared(point, rightMid) ? left : right;
}
