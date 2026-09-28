import { useRaceChartContext } from "./race-context.js";
import type { RaceChartContextValue } from "./race-context.js";

/**
 * The chart's scales, frame and accumulated series — the `<RaceChart>`
 * counterpart to `usePitch()`.
 *
 * This is how anything the chart doesn't draw itself gets drawn: bookings,
 * substitutions, a red card, a period annotation. None of those accumulate
 * a value, so none of them is a series; they are children that position
 * themselves through `scaleX` and `valueAt`.
 *
 * ```tsx
 * function Card({ minute, team }: { minute: number; team: string }) {
 *   const { scaleX, scaleY, valueAt } = useRaceChart();
 *   return <rect x={scaleX(minute) - 3} y={scaleY(valueAt(team, minute)) - 9} width={6} height={8} />;
 * }
 * ```
 */
export function useRaceChart(): RaceChartContextValue {
  return useRaceChartContext();
}
