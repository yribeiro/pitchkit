import { createColorScale } from "../../color/scale.js";
import type { PitchDimensions } from "../../dimensions/types.js";
import { computePositionalBins } from "../../heatmap/positional.js";
import type { PositionalHeatmapLayer } from "../../scene/types.js";
import type { PixelTransform } from "../../transform/types.js";

const DEFAULT_COLOR_MIN = "#1d4ed8"; // cool blue — low activity
const DEFAULT_COLOR_MAX = "#ef4444"; // hot red — high activity

/**
 * Paints a PositionalHeatmapLayer: one `fillRect` per Juego de Posición
 * zone, coloured from the zones' own min/max. Same shape as
 * `paintHeatmapLayer` — the only difference is where the rectangles come
 * from (pitch markings rather than a uniform grid), which is exactly why
 * the binning lives in its own pure module.
 *
 * Zone outlines are optional and off by default: with 20 unevenly-sized
 * zones the boundaries carry meaning, but they also compete with the pitch
 * markings they're derived from, so it's the caller's call.
 */
export function paintPositionalHeatmapLayer<T>(
  ctx: CanvasRenderingContext2D,
  layer: PositionalHeatmapLayer<T>,
  dimensions: PitchDimensions,
  transform: PixelTransform,
): void {
  const bins = computePositionalBins(layer, dimensions);
  const values = bins.map((b) => b.value);
  const colorScale = createColorScale(
    Math.min(...values),
    Math.max(...values),
    layer.colorMin ?? DEFAULT_COLOR_MIN,
    layer.colorMax ?? DEFAULT_COLOR_MAX,
  );

  for (const bin of bins) {
    const cornerA = transform.toPixel([bin.x, bin.y]);
    const cornerB = transform.toPixel([bin.x + bin.width, bin.y + bin.height]);
    const x = Math.min(cornerA[0], cornerB[0]);
    const y = Math.min(cornerA[1], cornerB[1]);
    const width = Math.abs(cornerB[0] - cornerA[0]);
    const height = Math.abs(cornerB[1] - cornerA[1]);

    ctx.fillStyle = colorScale(bin.value);
    ctx.fillRect(x, y, width, height);

    if (layer.stroke) {
      ctx.strokeStyle = layer.stroke;
      ctx.lineWidth = layer.strokeWidth ?? 1;
      ctx.strokeRect(x, y, width, height);
    }
  }
}
