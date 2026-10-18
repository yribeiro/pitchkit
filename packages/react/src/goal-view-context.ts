import type { GoalFrame, GoalLayout, GoalPoint } from "@pitchkit/core";
import { createChartContext } from "./chart-context.js";
import type { TooltipState } from "./context.js";

export interface GoalViewContextValue {
  /** The goal-mouth coordinate system the view was given by `type`. */
  readonly frame: GoalFrame;
  /** Where the view sits in the SVG, and its pixels per metre. */
  readonly layout: GoalLayout;
  /**
   * A goal-mouth coordinate, in the frame's own units, to pixels. A point
   * outside the view is pinned to its edge, `inset` pixels inside it, and
   * marked `clamped`; `undefined` for a missing coordinate.
   */
  readonly toPixel: (
    y: number | null | undefined,
    z: number | null | undefined,
    inset?: number,
  ) => GoalPoint | undefined;
}

interface InternalGoalViewContextValue extends GoalViewContextValue {
  readonly setTooltip: (tooltip: TooltipState | null) => void;
}

const goalView = createChartContext<InternalGoalViewContextValue>("GoalView");

export const GoalViewContext = goalView.Context;

/** Internal: marks read the tooltip setter alongside the transform. */
export const useGoalViewContext = goalView.use;

/**
 * The view's frame, layout and coordinate mapping: the `<GoalView>`
 * counterpart to `usePitch()`. For anything `<GoalShots>` doesn't draw,
 * such as a keeper's position or a label beside a shot.
 *
 * ```tsx
 * function Keeper({ y }: { y: number }) {
 *   const { toPixel } = useGoalView();
 *   const point = toPixel(y, 0);
 *   return point ? <rect x={point.x - 2} y={point.y - 40} width={4} height={40} /> : null;
 * }
 * ```
 */
export function useGoalView(): GoalViewContextValue {
  const { frame, layout, toPixel } = goalView.use();
  return { frame, layout, toPixel };
}
