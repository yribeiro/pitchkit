import type { ReactNode } from "react";
import { computePolygonCentroid, resolve } from "@pitchkit/core";
import type { PolygonLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface PolygonProps<T> extends Omit<PolygonLayer<T>, "type"> {
  tooltip?: (d: T, i: number) => ReactNode;
}

const DEFAULT_FILL = "var(--pitch-marker-primary, #3b82f6)";
// Area marks default to a partial fill so the pitch surface/markings
// underneath stay visible, unlike Scatter/Comet's opaque default — those
// are small marks, this can cover a large fraction of the pitch.
const DEFAULT_FILL_OPACITY = 0.35;

/** One `<polygon>` per datum, from an arbitrary list of vertices — mplsoccer's `polygon`. */
export function Polygon<T>({
  data,
  points,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  className,
  tooltip,
}: PolygonProps<T>) {
  const { transform, setTooltip } = usePitchContext();

  return (
    <g data-pitchkit-layer="polygon">
      {data.map((d, i) => {
        const vertices = resolve(points, d, i).map((p) => transform.toPixel(p));
        const [tx, ty] = computePolygonCentroid(vertices);
        // See Scatter.tsx's equivalent comment: the themed default backs
        // off when `className` is set, since an inline style always beats
        // a `className` utility at the same property.
        const fillValue =
          fill !== undefined ? resolve(fill, d, i) : className ? undefined : DEFAULT_FILL;
        const strokeValue = stroke !== undefined ? resolve(stroke, d, i) : undefined;
        const fillOpacityValue =
          fillOpacity !== undefined
            ? resolve(fillOpacity, d, i)
            : className
              ? undefined
              : DEFAULT_FILL_OPACITY;
        const strokeWidthValue = strokeWidth !== undefined ? resolve(strokeWidth, d, i) : undefined;

        return (
          <polygon
            key={i}
            points={vertices.map(([px, py]) => `${px},${py}`).join(" ")}
            data-pitchkit-mark="polygon"
            className={className}
            style={{
              fill: fillValue,
              fillOpacity: fillOpacityValue,
              stroke: strokeValue,
              strokeWidth: strokeWidthValue,
            }}
            onMouseEnter={
              tooltip ? () => setTooltip({ content: tooltip(d, i), x: tx, y: ty }) : undefined
            }
            onMouseLeave={tooltip ? () => setTooltip(null) : undefined}
          />
        );
      })}
    </g>
  );
}
