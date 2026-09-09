import type { PitchDimensions } from "../dimensions/types.js";
import { resolve } from "../scene/resolve.js";
import type { KdeLayer } from "../scene/types.js";

const DEFAULT_RESOLUTION = 64;
/** Beyond ~3 bandwidths a Gaussian contributes <1% of its peak; truncating there keeps this O(n) per cell rather than O(n·cells). */
const KERNEL_CUTOFF = 3;

/**
 * A kernel density estimate sampled on a regular grid over the pitch.
 * `values` is row-major (`row * cols + col`), each entry the estimated
 * density at that cell's *centre* in provider coordinates.
 */
export interface KdeGrid {
  readonly cols: number;
  readonly rows: number;
  readonly cellWidth: number;
  readonly cellHeight: number;
  /** Row-major density at each cell centre; length `cols * rows`. */
  readonly values: readonly number[];
  /** Highest density in `values` — 0 when there's no data. */
  readonly maxValue: number;
  /** The bandwidths actually used, whether given or derived by Silverman's rule. */
  readonly bandwidthX: number;
  readonly bandwidthY: number;
}

/**
 * Silverman's rule of thumb for a d-dimensional Gaussian kernel:
 * `h = σ · (4 / (d + 2))^(1/(d+4)) · n^(-1/(d+4))`. For d = 2 the constant
 * factor is exactly 1, leaving `h = σ · n^(-1/6)` — the same default
 * seaborn's `kdeplot` (which mplsoccer wraps) starts from.
 *
 * Hand-rolled, like `color/scale.ts`'s colour interpolation, rather than
 * taking a stats dependency for six lines of arithmetic.
 */
export function silvermanBandwidth(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance) * n ** (-1 / 6);
}

/**
 * Estimates a smooth density surface from point data via a 2D Gaussian
 * kernel density estimate, sampled on a `resolution x resolution` grid
 * over the pitch — mplsoccer's `kdeplot`. Unlike `computeHeatmapBins`,
 * which is a hard histogram, each point spreads influence over its
 * neighbourhood, so the result reads as a continuous surface rather than
 * a grid of cells.
 *
 * Pure and framework-agnostic (no pixels, no colour) like every other
 * binning function here; `render/canvas/paint-kde.ts` turns the grid into
 * pixels.
 *
 * The kernel is axis-aligned with a per-axis bandwidth, defaulting to
 * Silverman's rule (see `silvermanBandwidth`) so a caller gets a sensible
 * surface without tuning; `bandwidth` overrides both axes when the data's
 * own spread isn't the right smoothing scale (e.g. a handful of points).
 * Values are densities, not probabilities — they're only ever consumed
 * relative to `maxValue`, so the normalising constant is omitted.
 */
export function computeKdeGrid<T>(layer: KdeLayer<T>, dimensions: PitchDimensions): KdeGrid {
  const resolution = layer.resolution ?? DEFAULT_RESOLUTION;
  const cols = resolution;
  const rows = resolution;
  const cellWidth = dimensions.length / cols;
  const cellHeight = dimensions.width / rows;

  const xs: number[] = [];
  const ys: number[] = [];
  const weights: number[] = [];
  layer.data.forEach((d, i) => {
    const x = resolve(layer.x, d, i);
    const y = resolve(layer.y, d, i);
    if (x < 0 || x > dimensions.length || y < 0 || y > dimensions.width) return;
    xs.push(x);
    ys.push(y);
    weights.push(layer.weight !== undefined ? resolve(layer.weight, d, i) : 1);
  });

  // A zero bandwidth (identical points, or fewer than two of them) would
  // divide by zero; fall back to one grid cell of smoothing, the finest
  // scale this grid can express anyway.
  const requestedX = layer.bandwidth ?? silvermanBandwidth(xs);
  const requestedY = layer.bandwidth ?? silvermanBandwidth(ys);
  const hx = requestedX > 0 ? requestedX : cellWidth;
  const hy = requestedY > 0 ? requestedY : cellHeight;

  const values = new Array<number>(cols * rows).fill(0);
  let maxValue = 0;

  for (let i = 0; i < xs.length; i += 1) {
    const px = xs[i] as number;
    const py = ys[i] as number;
    const weight = weights[i] as number;

    // Only visit the cells within the kernel's cutoff radius — the rest
    // of the grid would gain a vanishing amount from this point.
    const colFrom = Math.max(0, Math.floor((px - KERNEL_CUTOFF * hx) / cellWidth));
    const colTo = Math.min(cols - 1, Math.ceil((px + KERNEL_CUTOFF * hx) / cellWidth));
    const rowFrom = Math.max(0, Math.floor((py - KERNEL_CUTOFF * hy) / cellHeight));
    const rowTo = Math.min(rows - 1, Math.ceil((py + KERNEL_CUTOFF * hy) / cellHeight));

    for (let row = rowFrom; row <= rowTo; row += 1) {
      const cy = (row + 0.5) * cellHeight;
      const dy = (cy - py) / hy;
      for (let col = colFrom; col <= colTo; col += 1) {
        const cx = (col + 0.5) * cellWidth;
        const dx = (cx - px) / hx;
        const index = row * cols + col;
        const next = (values[index] as number) + weight * Math.exp(-0.5 * (dx * dx + dy * dy));
        values[index] = next;
        if (next > maxValue) maxValue = next;
      }
    }
  }

  return { cols, rows, cellWidth, cellHeight, values, maxValue, bandwidthX: hx, bandwidthY: hy };
}
