import type { ReactNode } from "react";
import { computeArrowHeadCorners, resolve } from "@pitchkit/core";
import type { ArrowsLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface ArrowsProps<T> extends Omit<ArrowsLayer<T>, "type"> {
  tooltip?: (d: T, i: number) => ReactNode;
}

const DEFAULT_STROKE = "var(--pitch-marker-primary, #3b82f6)";
const DEFAULT_STROKE_WIDTH = 1.5;
const DEFAULT_HEAD_SIZE = 6;

/**
 * One shaft `<line>` + arrowhead `<polygon>` per datum — the JSX
 * equivalent of core's `paintArrowsLayer`, sharing its `computeArrowHeadCorners`
 * geometry so the head angle can't drift between the two renderers.
 */
export function Arrows<T>({
  data,
  x,
  y,
  x2,
  y2,
  stroke,
  strokeWidth,
  strokeOpacity,
  headSize,
  className,
  tooltip,
}: ArrowsProps<T>) {
  const { transform, setTooltip } = usePitchContext();

  return (
    <g data-pitchkit-layer="arrows">
      {data.map((d, i) => {
        const start = transform.toPixel([resolve(x, d, i), resolve(y, d, i)]);
        const end = transform.toPixel([resolve(x2, d, i), resolve(y2, d, i)]);
        // See Scatter.tsx's equivalent comment: the themed default falls
        // back to an inline style, which always beats a `className`
        // utility at the same property, so it only applies when
        // `className` is absent.
        const strokeValue =
          stroke !== undefined ? resolve(stroke, d, i) : className ? undefined : DEFAULT_STROKE;
        const strokeWidthValue = resolve(strokeWidth ?? DEFAULT_STROKE_WIDTH, d, i);
        const opacityValue = strokeOpacity !== undefined ? resolve(strokeOpacity, d, i) : undefined;
        const headSizeValue = resolve(headSize ?? DEFAULT_HEAD_SIZE, d, i);
        const [headA, headB] = computeArrowHeadCorners(start, end, headSizeValue);

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
            <line
              x1={start[0]}
              y1={start[1]}
              x2={end[0]}
              y2={end[1]}
              data-pitchkit-mark="arrow-shaft"
              className={className}
              style={{ stroke: strokeValue, strokeWidth: strokeWidthValue, opacity: opacityValue }}
            />
            <polygon
              points={`${end[0]},${end[1]} ${headA[0]},${headA[1]} ${headB[0]},${headB[1]}`}
              data-pitchkit-mark="arrow-head"
              className={className}
              style={{ fill: strokeValue, opacity: opacityValue }}
            />
          </g>
        );
      })}
    </g>
  );
}
