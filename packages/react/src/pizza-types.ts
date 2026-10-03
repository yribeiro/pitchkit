import type { ReactNode } from "react";
import type { LabelRotation, Point, PolarRange } from "@pitchkit/core";

/**
 * One slice. Values are drawn as given — PitchKit computes no per-90s or
 * percentiles. `min`/`max` default to 0–100, which is what a percentile is;
 * `lowerIsBetter` flips the slice so a long one is always the better one.
 */
export interface PizzaMetric extends PolarRange {
  /** Key into each series' `values`, and the stable identity of the slice. */
  readonly id: string;
  /** Defaults to `id`. */
  readonly label?: string;
  /**
   * A category such as "Attacking". With one series the slices take their
   * group's colour; with several, the group shows as an arc on the rim.
   */
  readonly group?: string;
}

/** One player, team or profile. */
export interface PizzaSeries {
  readonly id: string;
  /** Legend and readout text. Defaults to `id`. */
  readonly label?: string;
  /** Keyed by metric id. A missing or non-finite value draws no slice. */
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

/** How a group of slices is coloured. */
export interface PizzaGroup {
  /** Any CSS colour. Defaults to `--pitch-series-N` in order of first appearance (after the series' slots when several series share the chart). */
  readonly color?: string;
  /** Applied to the group, as for a series: `text-sky-500`. Drops the themed default. */
  readonly className?: string;
}

/** How several series share a metric's slice. */
export type PizzaSeriesLayout = "side-by-side" | "overlay";

/** Structure only — never colour, per D8. */
export interface PizzaAppearance {
  /**
   * Each slice's value in a box at its tip. @default true for one series or
   * an overlay, false for side-by-side (too crowded)
   */
  readonly values?: boolean;
  /** What each colour is: the series, or with one series its groups. @default true when there is something to say */
  readonly legend?: boolean;
}

/** Which slice is open. */
export interface PizzaSelection {
  readonly metricId: string;
  readonly seriesId: string;
}

/** What `renderDetail` is given. */
export interface PizzaDetailContext {
  readonly metric: PizzaMetric;
  /** The series whose slice was chosen. */
  readonly series: PizzaSeries;
  /** Every series' value for this metric, by series id. */
  readonly values: Readonly<Record<string, number | undefined>>;
  /** Back to the chart. */
  readonly close: () => void;
}

export interface PizzaChartProps {
  /** The slices, clockwise from the top. */
  readonly metrics: readonly PizzaMetric[];
  /**
   * One slice per series per metric. Readable up to three side by side, or
   * two overlaid; more draws, with a development warning.
   */
  readonly series: readonly PizzaSeries[];
  /** How several series share a slice. @default "side-by-side" */
  readonly seriesLayout?: PizzaSeriesLayout;
  /** Colours for groups, by group name. */
  readonly groups?: Readonly<Record<string, PizzaGroup>>;
  /** How metric labels sit around the rim. @default "tangent" */
  readonly labelRotation?: LabelRotation;
  /** Text for values. Defaults to at most two decimals. */
  readonly format?: (value: number, metric: PizzaMetric) => string;
  /**
   * Makes slices clickable: activating one replaces the chart with what this
   * returns, with a Back button. Without it nothing is clickable.
   */
  readonly renderDetail?: (context: PizzaDetailContext) => ReactNode;
  /** Controlled selection; `null` shows the chart. Omit for uncontrolled. */
  readonly selected?: PizzaSelection | null;
  readonly onSelectedChange?: (selection: PizzaSelection | null) => void;

  /** Fixed pixel size — the opt-out from the responsive default. Provide both, or neither. */
  readonly width?: number;
  readonly height?: number;
  /** Shape of the responsive box. @default 1 */
  readonly aspectRatio?: number;
  readonly appearance?: PizzaAppearance;
  readonly className?: string;
  /** Annotations, positioned through `usePizzaChart()`. */
  readonly children?: ReactNode;
}

export interface PizzaChartContextValue {
  readonly cx: number;
  readonly cy: number;
  /** Radius of the hole, where every slice starts. */
  readonly inner: number;
  /** Radius of the rim. */
  readonly outer: number;
  /** A slice's middle angle in radians, clockwise from the top. */
  readonly angleOf: (metricId: string) => number;
  /** Where a value lands along its slice's middle, clamped to the slice. */
  readonly pointAt: (metricId: string, value: number) => Point | undefined;
}
