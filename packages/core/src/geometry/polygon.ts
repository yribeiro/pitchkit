import type { Point } from "../transform/types.js";

/**
 * Mean of the vertices. Used as the anchor point for a `<Polygon>` tooltip
 * (there's no single "position" for an arbitrary shape the way a scatter
 * point has one) — not a true area centroid, which would need per-edge
 * shoelace weighting for a non-convex or unevenly-vertexed shape.
 */
export function computePolygonCentroid(points: readonly Point[]): Point {
  if (points.length === 0) return [0, 0];
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
  }
  return [sumX / points.length, sumY / points.length];
}
