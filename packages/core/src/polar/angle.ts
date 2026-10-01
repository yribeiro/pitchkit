import type { Point } from "../transform/types.js";

/**
 * The angle of axis `index` of `count`, in radians clockwise from twelve
 * o'clock. Every polar chart starts at the top and runs clockwise, the way
 * football radars and pizzas are read; this is the one place that
 * convention lives.
 */
export function axisAngle(index: number, count: number): number {
  return count > 0 ? (index / count) * 2 * Math.PI : 0;
}

/** The point at `radius` from (`cx`, `cy`) along `angle` (clockwise from the top). */
export function polarPoint(cx: number, cy: number, radius: number, angle: number): Point {
  return [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
}
