import type { PitchDimensions } from "../dimensions/types.js";
import { fromExtentFrame, toExtentFrame } from "../transform/canonical.js";

/** One movement/pass, in provider coordinates, before binning. */
export interface FlowVector {
  readonly x: number;
  readonly y: number;
  readonly x2: number;
  readonly y2: number;
}

/** One occupied grid cell: its center as the arrow start, the averaged end point, and how many vectors landed in it. */
export interface FlowBin {
  readonly x: number;
  readonly y: number;
  readonly x2: number;
  readonly y2: number;
  readonly count: number;
}

/**
 * Bins `vectors` by start location into a `binsX` x `binsY` grid over the
 * pitch (same cell math as `heatmap/bins.ts`'s `computeHeatmapBins`, kept
 * independent rather than shared — that helper sums a scalar weight per
 * bin, this one averages an end-point vector, which doesn't fit the same
 * single-accumulator shape). Each occupied bin becomes one arrow: from the
 * bin's center to the mean of every vector's end point that landed there.
 * Empty bins are omitted rather than returned with `count: 0`, since
 * there's no "zero-length arrow" to draw for a flow diagram the way a
 * heatmap still colors an empty cell.
 *
 * Binning happens in the extent frame (`0..length`, `0..width`), so each
 * start goes through `toExtentFrame` first and each bin centre comes back
 * through `fromExtentFrame` (D5). Without that, a centre-origin pitch drops
 * every vector starting at a negative x or y and draws the rest from the
 * wrong place (#90). End points are averaged as given, in provider
 * coordinates.
 */
export function computeFlowBins(
  vectors: readonly FlowVector[],
  binsX: number,
  binsY: number,
  dimensions: PitchDimensions,
): FlowBin[] {
  const { length, width } = dimensions;
  const cellWidth = length / binsX;
  const cellHeight = width / binsY;

  const sums = new Map<number, { count: number; endX: number; endY: number }>();

  for (const vector of vectors) {
    const [x, y] = toExtentFrame(dimensions, [vector.x, vector.y]);
    if (x < 0 || x > length || y < 0 || y > width) continue;

    const col = Math.min(Math.floor(x / cellWidth), binsX - 1);
    const row = Math.min(Math.floor(y / cellHeight), binsY - 1);
    const index = row * binsX + col;

    const existing = sums.get(index) ?? { count: 0, endX: 0, endY: 0 };
    sums.set(index, {
      count: existing.count + 1,
      endX: existing.endX + vector.x2,
      endY: existing.endY + vector.y2,
    });
  }

  const bins: FlowBin[] = [];
  for (const [index, { count, endX, endY }] of sums) {
    const row = Math.floor(index / binsX);
    const col = index % binsX;
    const [x, y] = fromExtentFrame(dimensions, [
      col * cellWidth + cellWidth / 2,
      row * cellHeight + cellHeight / 2,
    ]);
    bins.push({
      x,
      y,
      x2: endX / count,
      y2: endY / count,
      count,
    });
  }
  return bins;
}
