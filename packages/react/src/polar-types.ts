import type { ReactNode } from "react";
import type { PolarRange } from "@pitchkit/core";

/**
 * One metric on a polar chart: an axis on a radar, a slice on a pizza. The
 * same list feeds both. Values are drawn as given — PitchKit computes no
 * per-90s, percentiles or ranges.
 */
export interface PolarMetric extends PolarRange {
  /** Key into each series' `values`, and the stable identity of the axis. */
  readonly id: string;
  /** Defaults to `id`. */
  readonly label?: string;
  /** A category such as "Attacking" — the pizza colours by it. */
  readonly group?: string;
}

/** One player, team or profile. */
export interface PolarSeries {
  readonly id: string;
  /** Legend and readout text. Defaults to `id`. */
  readonly label?: string;
  /** Keyed by metric id. A missing or non-finite value draws nothing. */
  readonly values: Readonly<Record<string, number | null | undefined>>;
  /**
   * Any CSS colour, usually a `var()`. Defaults to `--pitch-series-N` by
   * position, so colour follows the entity, never its rank.
   */
  readonly color?: string;
  /**
   * Applied to the series' group. Every part inside paints with
   * `currentColor`, so `text-rose-500` recolours the whole series; drops the
   * themed default, as on every mark layer (D9).
   */
  readonly className?: string;
}

/** What is open: a metric, and on a pizza the series whose slice it was. */
export interface PolarSelection {
  readonly metricId: string;
  readonly seriesId?: string;
}

/** What `renderDetail` is given. */
export interface PolarDetailContext {
  readonly metric: PolarMetric;
  /** The series whose slice was chosen (pizza); `undefined` for a radar axis. */
  readonly series: PolarSeries | undefined;
  /** Every series' value for this metric, by series id. */
  readonly values: Readonly<Record<string, number | undefined>>;
  /** Back to the chart. */
  readonly close: () => void;
}

/** The click-to-detail props, shared by both polar charts. */
export interface PolarDetailProps {
  /**
   * Makes metrics clickable: activating one replaces the chart with what
   * this returns, with a Back button. Without it nothing is clickable.
   */
  readonly renderDetail?: (context: PolarDetailContext) => ReactNode;
  /** Controlled selection; `null` shows the chart. Omit for uncontrolled. */
  readonly selected?: PolarSelection | null;
  readonly onSelectedChange?: (selection: PolarSelection | null) => void;
}
