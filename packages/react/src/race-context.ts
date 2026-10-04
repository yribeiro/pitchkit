import { createChartContext } from "./chart-context.js";
import type { ChartFrame, LinearScale, MomentumPanel, RacePoint } from "@pitchkit/core";

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
  /** One per period, left to right with no gap: `panels[period - 1]`. */
  readonly panels: readonly MomentumPanel[];
  /** Match minute in a period (1 for the first half) -> pixel. */
  readonly scaleX: (minute: number, period: number) => number;
  /** Accumulated value -> pixel, already flipped for SVG. */
  readonly scaleY: LinearScale;
  readonly series: readonly ResolvedRaceSeries[];
  /** Where the last period ends, in match minutes. */
  readonly endTime: number;
  /**
   * The cumulative value of `seriesId` at `time` in `period`.
   *
   * Exposed rather than kept internal because the built-in crosshair is
   * already built from it — "every series at the hovered minute" is one
   * call per series — and an annotation child needs exactly the same thing
   * to sit *on* a line rather than float beside it.
   */
  readonly valueAt: (seriesId: string, time: number, period: number) => number;
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
 * function Card({ minute, period, team }: { minute: number; period: number; team: string }) {
 *   const { scaleX, scaleY, valueAt } = useRaceChart();
 *   const x = scaleX(minute, period);
 *   return <rect x={x - 3} y={scaleY(valueAt(team, minute, period)) - 9} width={6} height={8} />;
 * }
 * ```
 */
export const useRaceChart: () => RaceChartContextValue = race.use;
