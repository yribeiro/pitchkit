import { useId } from "react";
import type { ReactNode } from "react";
import { computeCometQuad, resolve } from "@pitchkit/core";
import type { CometLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface CometProps<T> extends Omit<CometLayer<T>, "type"> {
  tooltip?: (d: T, i: number) => ReactNode;
}

const DEFAULT_COLOR = "var(--pitch-marker-primary, #3b82f6)";
const DEFAULT_START_WIDTH = 0.5;
const DEFAULT_END_WIDTH = 4;

/**
 * One filled quadrilateral per datum — the JSX equivalent of core's
 * `paintCometLayer`, sharing its `computeCometQuad` taper geometry. Gradient
 * ids come from `useId()` (SSR-safe stable id) rather than a module-level
 * counter like core's DOM renderer, since two independent server renders
 * must not produce colliding ids.
 */
export function Comet<T>({
  data,
  x,
  y,
  x2,
  y2,
  color,
  startWidth,
  endWidth,
  gradient,
  className,
  tooltip,
}: CometProps<T>) {
  const { transform, setTooltip } = usePitchContext();
  const baseId = useId();

  return (
    <g data-pitchkit-layer="comet">
      {data.map((d, i) => {
        const start = transform.toPixel([resolve(x, d, i), resolve(y, d, i)]);
        const end = transform.toPixel([resolve(x2, d, i), resolve(y2, d, i)]);
        // `colorValue` always has a themed default — needed unconditionally
        // for the gradient's `<stop>` colors below, which have no
        // `className`-based equivalent. The *flat* (non-gradient) fill is
        // the one that needs to back off that default when `className` is
        // set, for the same inline-style-beats-class reason as Scatter's
        // fill/stroke.
        const colorValue = resolve(color ?? DEFAULT_COLOR, d, i);
        const startWidthValue = resolve(startWidth ?? DEFAULT_START_WIDTH, d, i);
        const endWidthValue = resolve(endWidth ?? DEFAULT_END_WIDTH, d, i);
        const corners = computeCometQuad(start, end, startWidthValue, endWidthValue);
        const gradientId = `${baseId}-comet-${i}`;
        const flatFillValue = color !== undefined || !className ? colorValue : undefined;
        const fill = gradient ? `url(#${gradientId})` : flatFillValue;

        return (
          <g
            key={i}
            onMouseEnter={
              tooltip
                ? () => setTooltip({ content: tooltip(d, i), x: end[0], y: end[1] })
                : undefined
            }
            onMouseLeave={tooltip ? () => setTooltip(null) : undefined}
          >
            {gradient && (
              <defs>
                <linearGradient
                  id={gradientId}
                  gradientUnits="userSpaceOnUse"
                  x1={start[0]}
                  y1={start[1]}
                  x2={end[0]}
                  y2={end[1]}
                >
                  <stop offset="0%" stopColor={colorValue} stopOpacity={0} />
                  <stop offset="100%" stopColor={colorValue} stopOpacity={1} />
                </linearGradient>
              </defs>
            )}
            <polygon
              points={corners.map(([px, py]) => `${px},${py}`).join(" ")}
              data-pitchkit-mark="comet"
              className={className}
              style={{ fill, stroke: "none" }}
            />
          </g>
        );
      })}
    </g>
  );
}
