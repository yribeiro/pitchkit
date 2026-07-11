import type { Point } from "../transform/types.js";

/**
 * Computes the four corners of a tapered quadrilateral from `start` to
 * `end` (both already in pixel space), narrow at `start` (`startWidth`)
 * and wide at `end` (`endWidth`). SVG has no way to vary a `<line>`'s
 * stroke-width along its length, so both renderers build this shape
 * directly instead. Shared so the taper math can't drift between them.
 */
export function computeCometQuad(
  start: Point,
  end: Point,
  startWidth: number,
  endWidth: number,
): [Point, Point, Point, Point] {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;

  return [
    [start[0] + (nx * startWidth) / 2, start[1] + (ny * startWidth) / 2],
    [end[0] + (nx * endWidth) / 2, end[1] + (ny * endWidth) / 2],
    [end[0] - (nx * endWidth) / 2, end[1] - (ny * endWidth) / 2],
    [start[0] - (nx * startWidth) / 2, start[1] - (ny * startWidth) / 2],
  ];
}
