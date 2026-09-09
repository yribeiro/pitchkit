import type { Point } from "../transform/types.js";

function cross(o: Point, a: Point, b: Point): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/**
 * Convex hull via the monotone chain (Andrew's) algorithm: sort points
 * lexicographically, then build the lower and upper hull chains in one pass
 * each, popping any point that would make a clockwise (non-left) turn.
 * O(n log n), no dependency — the same "hand-rolled over a library" choice
 * as `color/scale.ts`'s `createColorScale`.
 *
 * Fewer than 3 distinct points have no well-defined hull interior; returns
 * the deduplicated points as-is (a point or a segment) rather than throwing,
 * so a caller can still render *something* for a sparse dataset.
 */
export function computeConvexHull(points: readonly Point[]): Point[] {
  const unique = Array.from(new Set(points.map((p) => `${p[0]},${p[1]}`))).map((key) => {
    const [x, y] = key.split(",").map(Number);
    return [x as number, y as number] as Point;
  });

  if (unique.length < 3) return unique;

  const sorted = unique.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const lower: Point[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2] as Point, lower[lower.length - 1] as Point, p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const p = sorted[i] as Point;
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2] as Point, upper[upper.length - 1] as Point, p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}
