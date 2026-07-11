import type { Point } from "../transform/types.js";

/**
 * Picks the SVG arc sweep-flag from already-transformed pixel-space points,
 * rather than assuming a fixed direction. The pixel transform may have
 * flipped or swapped axes (yDirection, orientation), which would otherwise
 * silently mirror the arc onto the wrong side. Shared between the SVG DOM
 * renderer and @pitchkit/react's JSX emission (both draw `<path>` arcs).
 */
export function arcSweepFlag(center: Point, start: Point, end: Point): 0 | 1 {
  const startAngle = Math.atan2(start[1] - center[1], start[0] - center[0]);
  const endAngle = Math.atan2(end[1] - center[1], end[0] - center[0]);
  let delta = endAngle - startAngle;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  return delta > 0 ? 1 : 0;
}

/**
 * Builds the SVG path `d` string for a circular arc between two
 * already-transformed pixel-space points. Shared so the DOM renderer and
 * React's JSX emission produce byte-identical path syntax.
 */
export function arcPathData(radius: number, start: Point, end: Point, sweep: 0 | 1): string {
  return `M ${start[0]} ${start[1]} A ${radius} ${radius} 0 0 ${sweep} ${end[0]} ${end[1]}`;
}
