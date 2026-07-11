import type { ReactNode } from "react";
import { resolve } from "@pitchkit/core";
import type { ScatterLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface ScatterProps<T> extends Omit<ScatterLayer<T>, "type"> {
  tooltip?: (d: T, i: number) => ReactNode;
}

const DEFAULT_RADIUS = 4;
const DEFAULT_FILL = "var(--pitch-marker-primary, #3b82f6)";

/** One `<circle>` per datum — the JSX equivalent of core's `paintScatterLayer`. */
export function Scatter<T>({
  data,
  x,
  y,
  r,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  tooltip,
}: ScatterProps<T>) {
  const { transform, setTooltip } = usePitchContext();

  return (
    <g data-pitchkit-layer="scatter">
      {data.map((d, i) => {
        const [cx, cy] = transform.toPixel([resolve(x, d, i), resolve(y, d, i)]);
        const radius = resolve(r ?? DEFAULT_RADIUS, d, i);
        const fillValue = resolve(fill ?? DEFAULT_FILL, d, i);
        const strokeValue = stroke !== undefined ? resolve(stroke, d, i) : "none";
        const fillOpacityValue = fillOpacity !== undefined ? resolve(fillOpacity, d, i) : undefined;
        const strokeWidthValue = strokeWidth !== undefined ? resolve(strokeWidth, d, i) : undefined;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            data-pitchkit-mark="scatter"
            style={{
              fill: fillValue,
              stroke: strokeValue,
              fillOpacity: fillOpacityValue,
              strokeWidth: strokeWidthValue,
            }}
            onMouseEnter={
              tooltip ? () => setTooltip({ content: tooltip(d, i), x: cx, y: cy }) : undefined
            }
            onMouseLeave={tooltip ? () => setTooltip(null) : undefined}
          />
        );
      })}
    </g>
  );
}
