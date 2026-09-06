import type { ReactNode } from "react";
import { computeConvexHull, computePolygonCentroid, resolve } from "@pitchkit/core";
import type { ConvexHullLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface ConvexHullProps<T> extends Omit<ConvexHullLayer<T>, "type"> {
  /** Static — there's exactly one resulting shape for the whole dataset, not one per datum. */
  tooltip?: ReactNode;
}

const DEFAULT_FILL = "var(--pitch-marker-primary, #3b82f6)";
const DEFAULT_FILL_OPACITY = 0.35;

/**
 * One filled `<polygon>` for the convex hull of every datum's `(x, y)` —
 * e.g. a player's touch map. Unlike per-datum marks, `fill`/`stroke`/etc.
 * take plain values rather than `Accessor<T, V>`, since there's only ever
 * one shape produced from the whole `data` array.
 */
export function ConvexHull<T>({
  data,
  x,
  y,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  className,
  tooltip,
}: ConvexHullProps<T>) {
  const { transform, setTooltip } = usePitchContext();

  const points = data.map((d, i) => transform.toPixel([resolve(x, d, i), resolve(y, d, i)]));
  const hull = computeConvexHull(points);
  const [tx, ty] = computePolygonCentroid(hull);

  const fillValue = fill ?? (className ? undefined : DEFAULT_FILL);
  const fillOpacityValue = fillOpacity ?? (className ? undefined : DEFAULT_FILL_OPACITY);

  return (
    <g data-pitchkit-layer="convex-hull">
      <polygon
        points={hull.map(([px, py]) => `${px},${py}`).join(" ")}
        data-pitchkit-mark="convex-hull"
        className={className}
        style={{ fill: fillValue, fillOpacity: fillOpacityValue, stroke, strokeWidth }}
        onMouseEnter={
          tooltip !== undefined ? () => setTooltip({ content: tooltip, x: tx, y: ty }) : undefined
        }
        onMouseLeave={tooltip !== undefined ? () => setTooltip(null) : undefined}
      />
    </g>
  );
}
