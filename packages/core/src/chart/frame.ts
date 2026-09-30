import type { ChartFrame, ChartPadding } from "./types.js";

/**
 * Carves the plot rectangle out of a chart's outer box.
 *
 * The analogue of `createPixelTransform`'s padding handling, minus every
 * pitch concern: no crop, no orientation, no uniform-scale constraint. A
 * chart's two axes are independent by definition — that is what makes it a
 * chart and not a pitch — so there is no `Math.min` of the two scales here.
 *
 * Padding is clamped so a plot area can never be negative: a chart rendered
 * into a container narrower than its own padding collapses to a zero-width
 * plot rather than inverting and drawing itself inside out.
 */
export function computeChartFrame(
  width: number,
  height: number,
  padding: ChartPadding,
): ChartFrame {
  const x0 = Math.min(padding.left, width);
  const y0 = Math.min(padding.top, height);
  const x1 = Math.max(width - padding.right, x0);
  const y1 = Math.max(height - padding.bottom, y0);

  return {
    width,
    height,
    x0,
    y0,
    x1,
    y1,
    plotWidth: x1 - x0,
    plotHeight: y1 - y0,
  };
}
