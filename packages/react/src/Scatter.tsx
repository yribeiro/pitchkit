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
  className,
  tooltip,
}: ScatterProps<T>) {
  const { transform, setTooltip } = usePitchContext();

  return (
    <g data-pitchkit-layer="scatter">
      {data.map((d, i) => {
        const [cx, cy] = transform.toPixel([resolve(x, d, i), resolve(y, d, i)]);
        const radius = resolve(r ?? DEFAULT_RADIUS, d, i);
        // `fill`/`stroke` are the only two visual props with a themed
        // fallback rather than "just leave it unset" — and that fallback is
        // an inline style, which always beats a `className` utility class
        // (`fill-emerald-400`, say) at the same CSS property, opt-in or
        // not. So the fallback only applies when `className` is absent;
        // passing `className` hands color ownership to it, same as passing
        // `fill`/`stroke` explicitly still does either way.
        const fillValue =
          fill !== undefined ? resolve(fill, d, i) : className ? undefined : DEFAULT_FILL;
        const strokeValue =
          stroke !== undefined ? resolve(stroke, d, i) : className ? undefined : "none";
        const fillOpacityValue = fillOpacity !== undefined ? resolve(fillOpacity, d, i) : undefined;
        const strokeWidthValue = strokeWidth !== undefined ? resolve(strokeWidth, d, i) : undefined;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            data-pitchkit-mark="scatter"
            className={className}
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
