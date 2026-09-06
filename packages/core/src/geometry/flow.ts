import type { PitchDimensions } from "../dimensions/types.js";

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
    if (vector.x < 0 || vector.x > length || vector.y < 0 || vector.y > width) continue;

    const col = Math.min(Math.floor(vector.x / cellWidth), binsX - 1);
    const row = Math.min(Math.floor(vector.y / cellHeight), binsY - 1);
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
    bins.push({
      x: col * cellWidth + cellWidth / 2,
      y: row * cellHeight + cellHeight / 2,
      x2: endX / count,
      y2: endY / count,
      count,
    });
  }
  return bins;
}
