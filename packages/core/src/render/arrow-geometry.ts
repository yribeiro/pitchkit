import type { Point } from "../transform/types.js";

/** Half-angle of the arrowhead, in radians (~26°) — a conventional proportion. */
export const ARROW_HEAD_HALF_ANGLE = Math.PI / 7;

/**
 * Computes the two back corners of an arrowhead triangle pointing from
 * `start` to `end`, both already in pixel space. Shared between the SVG
 * DOM renderer and @pitchkit/react's JSX emission — the angle is derived
 * from the *pixel-space* endpoints (not provider coordinates) so it points
 * correctly regardless of any axis flip/swap the pixel transform applied
 * (orientation, yDirection), consistent with `arcSweepFlag`'s approach.
 */
export function computeArrowHeadCorners(
  start: Point,
  end: Point,
  headSize: number,
): [Point, Point] {
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const cornerA: Point = [
    end[0] - headSize * Math.cos(angle - ARROW_HEAD_HALF_ANGLE),
    end[1] - headSize * Math.sin(angle - ARROW_HEAD_HALF_ANGLE),
  ];
  const cornerB: Point = [
    end[0] - headSize * Math.cos(angle + ARROW_HEAD_HALF_ANGLE),
    end[1] - headSize * Math.sin(angle + ARROW_HEAD_HALF_ANGLE),
  ];
  return [cornerA, cornerB];
}
