import type { ReactNode } from "react";
import { resolve } from "@pitchkit/core";
import type { Accessor } from "@pitchkit/core";
import { useGoalViewContext } from "./goal-view-context.js";

export interface GoalShotsProps<T> {
  readonly data: readonly T[];
  /** Across the goal, in the view's `type` units: StatsBomb's `endY` (`end_location[1]`). */
  readonly y: Accessor<T, number | null | undefined>;
  /**
   * Height off the ground, in the view's `type` units: StatsBomb's `endZ`
   * (`end_location[2]`). A shot without one is not drawn.
   */
  readonly z: Accessor<T, number | null | undefined>;
  readonly r?: Accessor<T, number>;
  readonly fill?: Accessor<T, string>;
  readonly fillOpacity?: Accessor<T, number>;
  readonly stroke?: Accessor<T, string>;
  readonly strokeWidth?: Accessor<T, number>;
  readonly className?: string;
  readonly tooltip?: (d: T, i: number) => ReactNode;
}

const DEFAULT_RADIUS = 6;
const DEFAULT_FILL = "var(--pitch-marker-primary, #3b82f6)";
const DEFAULT_STROKE = "var(--pitch-goal-backdrop, #0f2a19)";

/**
 * One `<circle>` per shot, where it crossed the goal line, inside a
 * `<GoalView>`. The goal view's `<Scatter>`: the same accessor props, with
 * `y` and `z` for across and up.
 *
 * A shot outside the view is pinned just inside its edge and carries
 * `data-pitchkit-clamped`, so a shot far wide still shows which side it
 * went. A shot with no height (StatsBomb's blocked and wayward shots) is
 * not drawn.
 */
export function GoalShots<T>({
  data,
  y,
  z,
  r,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  className,
  tooltip,
}: GoalShotsProps<T>) {
  const { toPixel, setTooltip } = useGoalViewContext();

  return (
    <g data-pitchkit-layer="goal-shots">
      {data.map((d, i) => {
        const radius = resolve(r ?? DEFAULT_RADIUS, d, i);
        const point = toPixel(resolve(y, d, i), resolve(z, d, i), radius);
        if (!point) return null;
        // As for <Scatter>: a className without a colour prop owns the
        // colour, so the themed inline default steps aside (D9).
        const fillValue =
          fill !== undefined ? resolve(fill, d, i) : className ? undefined : DEFAULT_FILL;
        const strokeValue =
          stroke !== undefined ? resolve(stroke, d, i) : className ? undefined : DEFAULT_STROKE;
        const strokeWidthValue =
          strokeWidth !== undefined ? resolve(strokeWidth, d, i) : className ? undefined : 1.5;

        return (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={radius}
            data-pitchkit-mark="goal-shot"
            data-pitchkit-clamped={point.clamped ? "" : undefined}
            className={className}
            style={{
              fill: fillValue,
              stroke: strokeValue,
              strokeWidth: strokeWidthValue,
              fillOpacity: fillOpacity !== undefined ? resolve(fillOpacity, d, i) : undefined,
            }}
            onMouseEnter={
              tooltip
                ? () => setTooltip({ content: tooltip(d, i), x: point.x, y: point.y })
                : undefined
            }
            onMouseLeave={tooltip ? () => setTooltip(null) : undefined}
          />
        );
      })}
    </g>
  );
}
