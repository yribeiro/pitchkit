import type { ReactNode } from "react";
import { computeArrowHeadCorners, computeFlowBins, createColorScale, resolve } from "@pitchkit/core";
import type { FlowBin, FlowLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface FlowProps<T> extends Omit<FlowLayer<T>, "type"> {
  /** Per-*bin* (not per-datum) — the rendered arrows are aggregates, one per occupied grid cell. */
  tooltip?: (bin: FlowBin, i: number) => ReactNode;
}

const DEFAULT_BINS_X = 6;
const DEFAULT_BINS_Y = 5;
const DEFAULT_COLOR_MIN = "#93c5fd";
const DEFAULT_COLOR_MAX = "#1d4ed8";
const DEFAULT_STROKE_WIDTH_MIN = 1;
const DEFAULT_STROKE_WIDTH_MAX = 4;
const DEFAULT_HEAD_SIZE = 6;

/**
 * Bins pass/movement data by start location (`computeFlowBins`) and draws
 * one arrow per occupied bin, from the bin center toward the mean end
 * point, colored and sized by that bin's volume — mplsoccer's `flow`.
 * Unlike every other layer here, the rendered marks are aggregates rather
 * than one-per-datum, so `tooltip` takes a `FlowBin`, not a `T`.
 */
export function Flow<T>({
  data,
  x,
  y,
  x2,
  y2,
  binsX = DEFAULT_BINS_X,
  binsY = DEFAULT_BINS_Y,
  colorMin = DEFAULT_COLOR_MIN,
  colorMax = DEFAULT_COLOR_MAX,
  strokeWidthMin = DEFAULT_STROKE_WIDTH_MIN,
  strokeWidthMax = DEFAULT_STROKE_WIDTH_MAX,
  className,
  tooltip,
}: FlowProps<T>) {
  const { dimensions, transform, setTooltip } = usePitchContext();

  const vectors = data.map((d, i) => ({
    x: resolve(x, d, i),
    y: resolve(y, d, i),
    x2: resolve(x2, d, i),
    y2: resolve(y2, d, i),
  }));
  const bins = computeFlowBins(vectors, binsX, binsY, dimensions);
  const counts = bins.map((bin) => bin.count);
  const minCount = counts.length > 0 ? Math.min(...counts) : 0;
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;
  const colorScale = createColorScale(minCount, maxCount, colorMin, colorMax);
  const countRange = maxCount - minCount || 1;

  return (
    <g data-pitchkit-layer="flow">
      {bins.map((bin, i) => {
        const start = transform.toPixel([bin.x, bin.y]);
        const end = transform.toPixel([bin.x2, bin.y2]);
        const t = (bin.count - minCount) / countRange;
        const color = colorScale(bin.count);
        const strokeWidthValue = strokeWidthMin + (strokeWidthMax - strokeWidthMin) * t;
        const [headA, headB] = computeArrowHeadCorners(start, end, DEFAULT_HEAD_SIZE);

        return (
          <g
            key={i}
            onMouseEnter={
              tooltip
                ? () => setTooltip({ content: tooltip(bin, i), x: end[0], y: end[1] })
                : undefined
            }
            onMouseLeave={tooltip ? () => setTooltip(null) : undefined}
          >
            <line
              x1={start[0]}
              y1={start[1]}
              x2={end[0]}
              y2={end[1]}
              data-pitchkit-mark="flow-shaft"
              className={className}
              style={{ stroke: color, strokeWidth: strokeWidthValue }}
            />
            <polygon
              points={`${end[0]},${end[1]} ${headA[0]},${headA[1]} ${headB[0]},${headB[1]}`}
              data-pitchkit-mark="flow-head"
              className={className}
              style={{ fill: color }}
            />
          </g>
        );
      })}
    </g>
  );
}
