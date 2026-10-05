import { createColorScale } from "../../color/scale.js";
import type { PitchDimensions } from "../../dimensions/types.js";
import { computeHexBins, hexCorners } from "../../hexbin/bins.js";
import type { HexbinLayer } from "../../scene/types.js";
import { fromExtentFrame } from "../../transform/canonical.js";
import type { PixelTransform } from "../../transform/types.js";

const DEFAULT_COLOR_MIN = "#1e3a8a"; // deep blue — sparse
const DEFAULT_COLOR_MAX = "#facc15"; // yellow — dense

/**
 * Paints a HexbinLayer: one filled hexagon path per occupied bin,
 * coloured from the occupied bins' own min/max. Unlike `paintHeatmapLayer`
 * there's no `fillRect` shortcut — a hexagon is a path — but the shape of
 * the code is otherwise identical, transform included, so hexagons line up
 * with the pitch markings and any SVG marks in the same Scene.
 *
 * The lattice doesn't stop cleanly at the touchlines (hexagons straddle
 * them by design), so the whole layer is clipped to the pitch rectangle
 * rather than letting edge cells bleed past the outline.
 */
export function paintHexbinLayer<T>(
  ctx: CanvasRenderingContext2D,
  layer: HexbinLayer<T>,
  dimensions: PitchDimensions,
  transform: PixelTransform,
): void {
  const bins = computeHexBins(layer, dimensions);
  if (bins.length === 0) return;

  const values = bins.map((b) => b.value);
  const colorScale = createColorScale(
    Math.min(...values),
    Math.max(...values),
    layer.colorMin ?? DEFAULT_COLOR_MIN,
    layer.colorMax ?? DEFAULT_COLOR_MAX,
  );

  // The pitch's corners in provider coordinates: on a centre-origin pitch
  // (0, 0) is the centre spot, so they go through fromExtentFrame (D5, #90).
  const pitchCornerA = transform.toPixel(fromExtentFrame(dimensions, [0, 0]));
  const pitchCornerB = transform.toPixel(
    fromExtentFrame(dimensions, [dimensions.length, dimensions.width]),
  );

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    Math.min(pitchCornerA[0], pitchCornerB[0]),
    Math.min(pitchCornerA[1], pitchCornerB[1]),
    Math.abs(pitchCornerB[0] - pitchCornerA[0]),
    Math.abs(pitchCornerB[1] - pitchCornerA[1]),
  );
  ctx.clip();

  for (const bin of bins) {
    const corners = hexCorners(bin.x, bin.y, bin.radius).map((corner) =>
      transform.toPixel([corner[0], corner[1]]),
    );

    ctx.beginPath();
    corners.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();

    ctx.fillStyle = colorScale(bin.value);
    ctx.fill();

    if (layer.stroke) {
      ctx.strokeStyle = layer.stroke;
      ctx.lineWidth = layer.strokeWidth ?? 1;
      ctx.stroke();
    }
  }

  ctx.restore();
}
