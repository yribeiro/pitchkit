import { useMomentumChartContext } from "./momentum-context.js";
import type { MomentumChartContextValue } from "./momentum-types.js";

/**
 * The chart's frame, per-period scales and bars — the `<MomentumChart>`
 * counterpart to `usePitch()` and `useRaceChart()`.
 *
 * This is how anything the chart doesn't draw itself gets drawn: a team
 * crest, a substitution annotated with a name, a shaded spell of pressure.
 * `scaleX(minute)` finds the right period for you, and `scaleY(value)`
 * is symmetric about the zero line.
 *
 * ```tsx
 * function Crest({ side, src }: { side: "home" | "away"; src: string }) {
 *   const { frame, scaleY } = useMomentumChart();
 *   const y = side === "home" ? scaleY(0) - 24 : scaleY(0) + 6;
 *   return <image href={src} x={frame.x0 - 22} y={y} width={18} height={18} />;
 * }
 * ```
 */
export function useMomentumChart(): MomentumChartContextValue {
  return useMomentumChartContext();
}
