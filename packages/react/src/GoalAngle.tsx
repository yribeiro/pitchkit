import type { ReactNode } from "react";
import { computePitchGeometry, computePolygonCentroid, resolve, selectGoal } from "@pitchkit/core";
import type { GoalAngleLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface GoalAngleProps<T> extends Omit<GoalAngleLayer<T>, "type"> {
  tooltip?: (d: T, i: number) => ReactNode;
}

const DEFAULT_FILL = "var(--pitch-marker-goal, #f97316)";
const DEFAULT_FILL_OPACITY = 0.25;
const DEFAULT_GOAL: "left" | "right" | "nearest" = "nearest";

/**
 * One triangular `<polygon>` wedge per datum, from the point to both
 * goalposts — the angle subtended at that point by the goal mouth
 * (mplsoccer's `goal_angle`). Goalpost coordinates come from
 * `computePitchGeometry(dimensions).goals`, already computed for the pitch
 * markings themselves; picking which of the two goals uses `selectGoal`.
 */
export function GoalAngle<T>({
  data,
  x,
  y,
  goal,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  className,
  tooltip,
}: GoalAngleProps<T>) {
  const { dimensions, transform, setTooltip } = usePitchContext();
  const { goals } = computePitchGeometry(dimensions);

  return (
    <g data-pitchkit-layer="goal-angle">
      {data.map((d, i) => {
        const point = [resolve(x, d, i), resolve(y, d, i)] as const;
        const goalChoice = resolve(goal ?? DEFAULT_GOAL, d, i);
        const goalLine = selectGoal(point, goals, goalChoice);
        const vertices = [point, goalLine.from, goalLine.to].map((p) => transform.toPixel(p));
        const [tx, ty] = computePolygonCentroid(vertices);

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
        const strokeValue = stroke !== undefined ? resolve(stroke, d, i) : undefined;
        const strokeWidthValue = strokeWidth !== undefined ? resolve(strokeWidth, d, i) : undefined;

        return (
          <polygon
            key={i}
            points={vertices.map(([px, py]) => `${px},${py}`).join(" ")}
            data-pitchkit-mark="goal-angle"
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
