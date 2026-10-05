import { createColorScale } from "../../color/scale.js";
import type { PitchDimensions } from "../../dimensions/types.js";
import { computeKdeGrid } from "../../kde/density.js";
import type { KdeLayer } from "../../scene/types.js";
import { fromExtentFrame } from "../../transform/canonical.js";
import type { PixelTransform } from "../../transform/types.js";

const DEFAULT_COLOR_MIN = "#22c55e"; // green — the low tail of the surface
const DEFAULT_COLOR_MAX = "#7c2d12"; // deep ember — the peak
const DEFAULT_MAX_OPACITY = 0.9;

/**
 * Paints a KdeLayer: the density grid, one `fillRect` per cell, with
 * opacity ramped by density so the surface fades out instead of washing
 * the whole pitch in `colorMin`. That alpha ramp is the only thing
 * separating this from `paintHeatmapLayer` visually, and it's what makes a
 * KDE read as a cloud over the pitch rather than a filled grid.
 *
 * Cells at zero density are skipped entirely (nothing to draw), which also
 * keeps the common case — a handful of points on a 64x64 grid — cheap.
 *
 * Cell edges are snapped to whole pixels so neighbours share an exact
 * boundary. Neither alternative works here: fractional edges leave
 * antialiased seams, and overlapping the cells to hide those seams would
 * double-composite the overlap, drawing a visible grid through the
 * semi-transparent tail of the surface.
 */
export function paintKdeLayer<T>(
  ctx: CanvasRenderingContext2D,
  layer: KdeLayer<T>,
  dimensions: PitchDimensions,
  transform: PixelTransform,
): void {
  const grid = computeKdeGrid(layer, dimensions);
  if (grid.maxValue <= 0) return;

  const colorScale = createColorScale(
    0,
    grid.maxValue,
    layer.colorMin ?? DEFAULT_COLOR_MIN,
    layer.colorMax ?? DEFAULT_COLOR_MAX,
  );
  const maxOpacity = layer.maxOpacity ?? DEFAULT_MAX_OPACITY;
  const previousAlpha = ctx.globalAlpha;

  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const value = grid.values[row * grid.cols + col] ?? 0;
      if (value <= 0) continue;

      // Grid cells are laid out in the extent frame; back to provider
      // coordinates before toPixel, or a centre-origin pitch draws the
      // surface half a pitch away from its data (D5, #90).
      const cornerA = transform.toPixel(
        fromExtentFrame(dimensions, [col * grid.cellWidth, row * grid.cellHeight]),
      );
      const cornerB = transform.toPixel(
        fromExtentFrame(dimensions, [(col + 1) * grid.cellWidth, (row + 1) * grid.cellHeight]),
      );
      const x0 = Math.round(Math.min(cornerA[0], cornerB[0]));
      const x1 = Math.round(Math.max(cornerA[0], cornerB[0]));
      const y0 = Math.round(Math.min(cornerA[1], cornerB[1]));
      const y1 = Math.round(Math.max(cornerA[1], cornerB[1]));

      ctx.globalAlpha = (value / grid.maxValue) * maxOpacity;
      ctx.fillStyle = colorScale(value);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }

  ctx.globalAlpha = previousAlpha;
}
