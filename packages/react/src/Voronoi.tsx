import type { ReactNode } from "react";
import { computePitchGeometry, computeVoronoiCells, resolve } from "@pitchkit/core";
import type { VoronoiLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface VoronoiProps<T> extends Omit<VoronoiLayer<T>, "type"> {
  tooltip?: (d: T, i: number) => ReactNode;
}

const DEFAULT_FILL = "var(--pitch-marker-primary, #3b82f6)";
const DEFAULT_FILL_OPACITY = 0.2;
const DEFAULT_STROKE = "var(--pitch-lines, rgba(255, 255, 255, 0.8))";

/**
 * One filled `<polygon>` cell per datum — Voronoi tessellation over every
 * datum's `(x, y)`, clipped to the pitch outline. Cells are computed in
 * provider coordinates (against `computePitchGeometry(dimensions).outline`)
 * and pixel-transformed afterward, the same order `Heatmap`'s binning uses,
 * so the tessellation itself is independent of orientation/crop.
 */
export function Voronoi<T>({
  data,
  x,
  y,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  className,
  tooltip,
}: VoronoiProps<T>) {
  const { dimensions, transform, setTooltip } = usePitchContext();

  const sites = data.map((d, i) => [resolve(x, d, i), resolve(y, d, i)] as const);
  const { outline } = computePitchGeometry(dimensions);
  const cells = computeVoronoiCells(sites, outline);

  return (
    <g data-pitchkit-layer="voronoi">
      {data.map((d, i) => {
        const cell = (cells[i] ?? []).map((p) => transform.toPixel(p));
        // See Scatter.tsx's equivalent comment: the themed default backs
        // off when `className` is set.
        const fillValue =
          fill !== undefined ? resolve(fill, d, i) : className ? undefined : DEFAULT_FILL;
        const fillOpacityValue =
          fillOpacity !== undefined
            ? resolve(fillOpacity, d, i)
            : className
              ? undefined
              : DEFAULT_FILL_OPACITY;
        const strokeValue =
          stroke !== undefined ? resolve(stroke, d, i) : className ? undefined : DEFAULT_STROKE;
        const strokeWidthValue = strokeWidth !== undefined ? resolve(strokeWidth, d, i) : 1;

        return (
          <polygon
            key={i}
            points={cell.map(([px, py]) => `${px},${py}`).join(" ")}
            data-pitchkit-mark="voronoi"
            className={className}
            style={{
              fill: fillValue,
              fillOpacity: fillOpacityValue,
              stroke: strokeValue,
              strokeWidth: strokeWidthValue,
            }}
            onMouseEnter={
              tooltip
                ? () => {
                    const [tx, ty] = transform.toPixel([resolve(x, d, i), resolve(y, d, i)]);
                    setTooltip({ content: tooltip(d, i), x: tx, y: ty });
                  }
                : undefined
            }
            onMouseLeave={tooltip ? () => setTooltip(null) : undefined}
          />
        );
      })}
    </g>
  );
}
