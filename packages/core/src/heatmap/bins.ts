import type { PitchDimensions } from "../dimensions/types.js";
import type { Rect } from "../scene/geometry.js";
import { resolve } from "../scene/resolve.js";
import type { HeatmapLayer } from "../scene/types.js";

const DEFAULT_BINS_X = 6;
const DEFAULT_BINS_Y = 5;

export interface HeatmapBin extends Rect {
  readonly value: number;
}

/**
 * Divides the pitch into a `binsX` x `binsY` grid (in provider coordinates)
 * and buckets each datum by point count, or by summed `weight` if the layer
 * provides one. Pure — knows nothing about pixels/canvas/color, which keeps
 * it independently testable and reusable regardless of render backend,
 * mirroring `computePitchGeometry`.
 *
 * Points outside the pitch extent are ignored rather than clamped into an
 * edge bin — they're not part of the pitch's heat distribution. Points
 * exactly on the far edge (x === length or y === width) land in the last
 * bin rather than being dropped.
 */
export function computeHeatmapBins<T>(
  layer: HeatmapLayer<T>,
  dimensions: PitchDimensions,
): HeatmapBin[] {
  const binsX = layer.binsX ?? DEFAULT_BINS_X;
  const binsY = layer.binsY ?? DEFAULT_BINS_Y;
  const cellWidth = dimensions.length / binsX;
  const cellHeight = dimensions.width / binsY;

  const values: number[] = new Array(binsX * binsY).fill(0);

  layer.data.forEach((d, i) => {
    const x = resolve(layer.x, d, i);
    const y = resolve(layer.y, d, i);
    if (x < 0 || x > dimensions.length || y < 0 || y > dimensions.width) return;

    const col = Math.min(Math.floor(x / cellWidth), binsX - 1);
    const row = Math.min(Math.floor(y / cellHeight), binsY - 1);
    const amount = layer.weight !== undefined ? resolve(layer.weight, d, i) : 1;

    const index = row * binsX + col;
    values[index] = (values[index] ?? 0) + amount;
  });

  const bins: HeatmapBin[] = [];
  for (let row = 0; row < binsY; row += 1) {
    for (let col = 0; col < binsX; col += 1) {
      bins.push({
        x: col * cellWidth,
        y: row * cellHeight,
        width: cellWidth,
        height: cellHeight,
        value: values[row * binsX + col] ?? 0,
      });
    }
  }
  return bins;
}
