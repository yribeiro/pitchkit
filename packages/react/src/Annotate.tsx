import type { CSSProperties, ReactNode } from "react";
import { resolve } from "@pitchkit/core";
import type { AnnotateLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface AnnotateProps<T> extends Omit<AnnotateLayer<T>, "type"> {
  tooltip?: (d: T, i: number) => ReactNode;
}

const TEXT_BASE_STYLE: CSSProperties = { fontSize: 10, textAnchor: "middle" };
const DEFAULT_FILL = "var(--pitch-lines, rgba(255, 255, 255, 0.8))";

/** One `<text>` per datum — the JSX equivalent of core's `paintAnnotateLayer`. */
export function Annotate<T>({
  data,
  x,
  y,
  label,
  offsetX,
  offsetY,
  className,
  tooltip,
}: AnnotateProps<T>) {
  const { transform, setTooltip } = usePitchContext();
  // The themed default fill is only applied when `className` is absent —
  // it's set as inline style, which always beats a class at the same
  // property, so a consumer's `fill-*` utility needs the default to back
  // off rather than losing to it. See Scatter.tsx's equivalent comment.
  const textStyle: CSSProperties = className ? TEXT_BASE_STYLE : { ...TEXT_BASE_STYLE, fill: DEFAULT_FILL };

  return (
    <g data-pitchkit-layer="annotate">
      {data.map((d, i) => {
        const [px, py] = transform.toPixel([resolve(x, d, i), resolve(y, d, i)]);
        const dx = offsetX !== undefined ? resolve(offsetX, d, i) : 0;
        const dy = offsetY !== undefined ? resolve(offsetY, d, i) : 0;
        const tx = px + dx;
        const ty = py + dy;

        return (
          <text
            key={i}
            x={tx}
            y={ty}
            data-pitchkit-mark="annotate"
            style={textStyle}
            className={className}
            onMouseEnter={
              tooltip ? () => setTooltip({ content: tooltip(d, i), x: tx, y: ty }) : undefined
            }
            onMouseLeave={tooltip ? () => setTooltip(null) : undefined}
          >
            {resolve(label, d, i)}
          </text>
        );
      })}
    </g>
  );
}
