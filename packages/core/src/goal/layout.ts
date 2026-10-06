import { GOAL_WIDTH_METRES, toGoalMetres } from "./frames.js";
import type { GoalFrame } from "./frames.js";

/**
 * The part of the goal plane a goal view shows, in metres: one goal width
 * either side of the middle, from the ground up to 4 m. Shots beyond it are
 * pinned to its edge rather than dropped (see {@link goalPoint}).
 */
export const GOAL_VIEW_HALF_WIDTH = GOAL_WIDTH_METRES;
export const GOAL_VIEW_TOP = 4;

/**
 * How far the ground strip under the goal line reaches down the view, in
 * goal-plane metres. With the camera below, it shows the six-yard line,
 * the penalty spot and the penalty-area line.
 */
export const GOAL_VIEW_GROUND = 1.7;

/**
 * The viewpoint the ground is drawn from: on the middle of the pitch,
 * `GOAL_CAMERA_DISTANCE` metres out from the goal line and
 * `GOAL_CAMERA_HEIGHT` metres up, looking level at the goal. The goal line
 * is the picture plane, so the goal mouth itself is drawn to scale with no
 * distortion and only the ground recedes.
 */
export const GOAL_CAMERA_DISTANCE = 30;
export const GOAL_CAMERA_HEIGHT = 1.2;

/** The whole view's width over its height. */
export const GOAL_VIEW_ASPECT = (2 * GOAL_VIEW_HALF_WIDTH) / (GOAL_VIEW_TOP + GOAL_VIEW_GROUND);

export interface GoalLayout {
  /** Pixels per metre on the goal line. */
  readonly scale: number;
  /** Pixel x of the middle of the goal. */
  readonly centreX: number;
  /** Pixel y of the goal line (the ground under the goal). */
  readonly groundY: number;
  /** The view's box in pixels, centred in the space it was fitted to. */
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Fits the view into `width` x `height` pixels, keeping its proportions and
 * centring it in whichever direction has room to spare.
 */
export function computeGoalLayout(width: number, height: number): GoalLayout {
  const scale = Math.min(
    width / (2 * GOAL_VIEW_HALF_WIDTH),
    height / (GOAL_VIEW_TOP + GOAL_VIEW_GROUND),
  );
  const viewWidth = 2 * GOAL_VIEW_HALF_WIDTH * scale;
  const viewHeight = (GOAL_VIEW_TOP + GOAL_VIEW_GROUND) * scale;
  const left = (width - viewWidth) / 2;
  const top = (height - viewHeight) / 2;
  return {
    scale,
    centreX: left + GOAL_VIEW_HALF_WIDTH * scale,
    groundY: top + GOAL_VIEW_TOP * scale,
    left,
    top,
    width: viewWidth,
    height: viewHeight,
  };
}

/** A point on the goal plane, in metres from the middle of the goal line, to pixels. */
export function goalPlaneToPixel(layout: GoalLayout, u: number, h: number): [number, number] {
  return [layout.centreX + u * layout.scale, layout.groundY - h * layout.scale];
}

/**
 * A point on the ground in front of the goal to pixels: `u` metres to the
 * shooter's right of the middle and `depth` metres out from the goal line.
 * `undefined` at or behind the camera, which has no projection.
 */
export function projectGround(
  layout: GoalLayout,
  u: number,
  depth: number,
): [number, number] | undefined {
  const distance = GOAL_CAMERA_DISTANCE - depth;
  if (distance <= 0) return undefined;
  const factor = GOAL_CAMERA_DISTANCE / distance;
  return [
    layout.centreX + u * factor * layout.scale,
    layout.groundY + ((GOAL_CAMERA_HEIGHT * depth) / distance) * layout.scale,
  ];
}

export interface GoalPoint {
  readonly x: number;
  readonly y: number;
  /** The point was outside the view and has been pinned to its edge. */
  readonly clamped: boolean;
}

/**
 * A shot's goal-mouth coordinates, in `frame`'s units, to pixels.
 *
 * A point outside the view is pinned to its edge and marked `clamped`, the
 * way a radar pins an off-scale value to its rim: a shot far wide still
 * shows which side it went. `inset` pins it that many pixels inside the
 * sides and top, so a mark of that radius stays whole. A height below the
 * ground is pinned to the ground. `undefined` for a missing or non-finite
 * coordinate, which draws nothing rather than a shot at the origin.
 */
export function goalPoint(
  layout: GoalLayout,
  frame: GoalFrame,
  y: number | null | undefined,
  z: number | null | undefined,
  inset = 0,
): GoalPoint | undefined {
  if (y === null || y === undefined || !Number.isFinite(y)) return undefined;
  if (z === null || z === undefined || !Number.isFinite(z)) return undefined;
  const [u, h] = toGoalMetres(frame, y, z);
  const margin = inset / layout.scale;
  const side = GOAL_VIEW_HALF_WIDTH - margin;
  const cu = Math.min(Math.max(u, -side), side);
  const ch = Math.min(Math.max(h, 0), GOAL_VIEW_TOP - margin);
  const [px, py] = goalPlaneToPixel(layout, cu, ch);
  return { x: px, y: py, clamped: cu !== u || ch !== h };
}
