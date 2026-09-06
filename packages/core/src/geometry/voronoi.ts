import type { Point } from "../transform/types.js";
import type { Rect } from "../scene/geometry.js";

function isInside(point: Point, boundaryPoint: Point, inwardNormal: Point): boolean {
  const dx = point[0] - boundaryPoint[0];
  const dy = point[1] - boundaryPoint[1];
  return dx * inwardNormal[0] + dy * inwardNormal[1] >= 0;
}

/** Where segment `a`->`b` crosses the line through `boundaryPoint` perpendicular to `inwardNormal`. */
function intersect(a: Point, b: Point, boundaryPoint: Point, inwardNormal: Point): Point {
  const [ax, ay] = a;
  const [bx, by] = b;
  const da = (ax - boundaryPoint[0]) * inwardNormal[0] + (ay - boundaryPoint[1]) * inwardNormal[1];
  const db = (bx - boundaryPoint[0]) * inwardNormal[0] + (by - boundaryPoint[1]) * inwardNormal[1];
  const t = da / (da - db);
  return [ax + (bx - ax) * t, ay + (by - ay) * t];
}

/**
 * Sutherland–Hodgman clip of a convex `polygon` against one half-plane: the
 * boundary line passes through `boundaryPoint` perpendicular to
 * `inwardNormal`, and points on the `inwardNormal` side are kept. Exported
 * directly (not just as a `voronoi.ts` internal) since it's the reusable
 * primitive `computeVoronoiCells` repeatedly applies per site pair, and it's
 * independently testable without a full multi-site setup.
 */
export function clipPolygonByHalfPlane(
  polygon: readonly Point[],
  boundaryPoint: Point,
  inwardNormal: Point,
): Point[] {
  if (polygon.length === 0) return [];

  const output: Point[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i] as Point;
    const previous = polygon[(i - 1 + polygon.length) % polygon.length] as Point;
    const currentInside = isInside(current, boundaryPoint, inwardNormal);
    const previousInside = isInside(previous, boundaryPoint, inwardNormal);

    if (currentInside) {
      if (!previousInside) {
        output.push(intersect(previous, current, boundaryPoint, inwardNormal));
      }
      output.push(current);
    } else if (previousInside) {
      output.push(intersect(previous, current, boundaryPoint, inwardNormal));
    }
  }
  return output;
}

function rectToPolygon(bounds: Rect): Point[] {
  return [
    [bounds.x, bounds.y],
    [bounds.x + bounds.width, bounds.y],
    [bounds.x + bounds.width, bounds.y + bounds.height],
    [bounds.x, bounds.y + bounds.height],
  ];
}

/**
 * Bounded Voronoi tessellation via half-plane intersection: each site's cell
 * starts as the full `bounds` rectangle and gets clipped by the
 * perpendicular-bisector half-plane against every other site (keeping the
 * side closer to this site). O(n²) clips total — core has no runtime
 * dependencies (`heatmap/colormap.ts`), so this stands in for a
 * Delaunay-based library (e.g. d3-delaunay) at the point counts a pitch
 * plot needs (tens of players, not thousands).
 *
 * Coincident sites produce a zero-magnitude bisector normal and are simply
 * skipped for that pair (clipping against a degenerate half-plane would
 * otherwise collapse the cell to nothing for both sites).
 */
export function computeVoronoiCells(sites: readonly Point[], bounds: Rect): Point[][] {
  return sites.map((site, i) => {
    let cell = rectToPolygon(bounds);
    sites.forEach((other, j) => {
      if (i === j) return;
      const normal: Point = [site[0] - other[0], site[1] - other[1]];
      if (normal[0] === 0 && normal[1] === 0) return;
      const midpoint: Point = [(site[0] + other[0]) / 2, (site[1] + other[1]) / 2];
      cell = clipPolygonByHalfPlane(cell, midpoint, normal);
    });
    return cell;
  });
}
