import { createContext, useContext } from "react";
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

export const RaceChartContext = createContext<RaceChartContextValue | null>(null);

/**
 * Internal: the chart's own children read scales through this. Throws
 * rather than rendering nothing, for the same reason `usePitchContext`
 * does — "annotation outside its chart" is a usage error the consumer
 * should see immediately, not debug from a blank panel.
 */
export function useRaceChartContext(): RaceChartContextValue {
  const ctx = useContext(RaceChartContext);
  if (!ctx) {
    throw new Error("@pitchkit/react: this component must be rendered inside <RaceChart>.");
  }
  return ctx;
}
