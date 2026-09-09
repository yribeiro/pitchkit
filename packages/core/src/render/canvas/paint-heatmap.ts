import type { PitchDimensions } from "../../dimensions/types.js";
import { computeHeatmapBins } from "../../heatmap/bins.js";
import { createColorScale } from "../../color/scale.js";
import type { HeatmapLayer } from "../../scene/types.js";
import type { PixelTransform } from "../../transform/types.js";

const DEFAULT_COLOR_MIN = "#1d4ed8"; // cool blue — low activity
const DEFAULT_COLOR_MAX = "#ef4444"; // hot red — high activity

/**
 * Paints a HeatmapLayer onto a 2D canvas context: one `fillRect` per bin,
 * colored via a value->color scale built from the bins' own min/max.
 * Reuses the same PixelTransform every other layer uses, so a bin aligns
 * exactly with the pitch markings and any SVG marks in the same Scene.
 */
export function paintHeatmapLayer<T>(
  ctx: CanvasRenderingContext2D,
  layer: HeatmapLayer<T>,
  dimensions: PitchDimensions,
  transform: PixelTransform,
): void {
  const bins = computeHeatmapBins(layer, dimensions);
  const values = bins.map((b) => b.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const colorScale = createColorScale(
    minValue,
    maxValue,
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
  }
}
