import { createChartContext } from "./chart-context.js";
import type { MomentumChartContextValue } from "./momentum-types.js";

const momentum = createChartContext<MomentumChartContextValue>("MomentumChart");

export const MomentumChartContext = momentum.Context;

/**
 * The chart's frame, per-period scales and bars — the `<MomentumChart>`
 * counterpart to `usePitch()` and `useRaceChart()`.
 *
 * This is how anything the chart doesn't draw itself gets drawn: a team
 * crest, a substitution annotated with a name, a shaded spell of pressure.
 * `scaleX(minute, period)` places a minute in its period, 1 for the first
 * half (minutes restart at 45, so a minute alone is ambiguous), and
 * `scaleY(value)` is symmetric about the zero line.
 *
 * ```tsx
 * function Crest({ side, src }: { side: "home" | "away"; src: string }) {
 *   const { frame, scaleY } = useMomentumChart();
 *   const y = side === "home" ? scaleY(0) - 24 : scaleY(0) + 6;
 *   return <image href={src} x={frame.x0 - 22} y={y} width={18} height={18} />;
 * }
 * ```
 */
export const useMomentumChart: () => MomentumChartContextValue = momentum.use;
