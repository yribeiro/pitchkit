import { createChartContext } from "./chart-context.js";
import type { ChartFrame, LinearScale, RacePoint } from "@pitchkit/core";

/** One series after its accessors have been resolved and accumulated. */
export interface ResolvedRaceSeries {
  readonly id: string;
  readonly label: string;
  readonly color: string | undefined;
  readonly className: string | undefined;
  readonly points: readonly RacePoint[];
  readonly total: number;
}

export interface RaceChartContextValue {
  readonly frame: ChartFrame;
  /** Match minute -> pixel. */
  readonly scaleX: LinearScale;
  /** Accumulated value -> pixel, already flipped for SVG. */
  readonly scaleY: LinearScale;
  readonly series: readonly ResolvedRaceSeries[];
  readonly endTime: number;
  /**
   * The cumulative value of `seriesId` at `time`.
   *
   * Exposed rather than kept internal because the built-in crosshair is
   * already built from it — "every series at the hovered minute" is one
   * call per series — and an annotation child needs exactly the same thing
   * to sit *on* a line rather than float beside it.
   */
  readonly valueAt: (seriesId: string, time: number) => number;
}

const race = createChartContext<RaceChartContextValue>("RaceChart");

export const RaceChartContext = race.Context;

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
export const useRaceChart: () => RaceChartContextValue = race.use;
