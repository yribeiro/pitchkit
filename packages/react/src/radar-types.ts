import type { ReactNode } from "react";
import type { LabelRotation, Point, PolarRange } from "@pitchkit/core";

/**
 * One axis. Values are drawn as given — PitchKit computes no per-90s,
 * percentiles or ranges. `min`/`max` default to 0–100; `lowerIsBetter`
 * flips the axis so outward is always better.
 */
export interface RadarMetric extends PolarRange {
  /** Key into each series' `values`, and the stable identity of the axis. */
  readonly id: string;
  /** Defaults to `id`. */
  readonly label?: string;
}

/** One player, team or profile. */
export interface RadarSeries {
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

/** Which axis is open. */
export interface RadarSelection {
  readonly metricId: string;
}

/** What `renderDetail` is given. */
export interface RadarDetailContext {
  readonly metric: RadarMetric;
  /** Every series' value for this metric, by series id. */
  readonly values: Readonly<Record<string, number | undefined>>;
  /** Back to the chart. */
  readonly close: () => void;
}

/** Structure only — never colour, per D8. */
export interface RadarAppearance {
  /** Each ring's value printed on every axis. @default true, false below 420px wide */
  readonly rangeLabels?: boolean;
  /** Which colour is which series. @default true for two or more series */
  readonly legend?: boolean;
  /**
   * A single series' shape banded in two tones of its colour where it
   * crosses the rings (mplsoccer's look). @default true; ignored for
   * several series, where it would read as an overlap.
   */
  readonly bands?: boolean;
}

export interface RadarChartProps {
  /** The axes, clockwise from the top. Each has its own range; at least three. */
  readonly metrics: readonly RadarMetric[];
  /** One shape per series. Readable up to three; more draws, with a development warning. */
  readonly series: readonly RadarSeries[];
  /** Range rings between the centre circle and the rim. @default 4 */
  readonly rings?: number;
  /** How metric labels and ring values sit around the rim. @default "tangent" */
  readonly labelRotation?: LabelRotation;
  /** Text for ring values and the readout. Defaults to at most two decimals. */
  readonly format?: (value: number, metric: RadarMetric) => string;
  /**
   * Makes axis labels clickable: activating one replaces the chart with what
   * this returns, with a Back button. Without it nothing is clickable.
   */
  readonly renderDetail?: (context: RadarDetailContext) => ReactNode;
  /** Controlled selection; `null` shows the chart. Omit for uncontrolled. */
  readonly selected?: RadarSelection | null;
  readonly onSelectedChange?: (selection: RadarSelection | null) => void;

  /** Fixed pixel size — the opt-out from the responsive default. Provide both, or neither. */
  readonly width?: number;
  readonly height?: number;
  /** Shape of the responsive box. @default 1 */
  readonly aspectRatio?: number;
  readonly appearance?: RadarAppearance;
  readonly className?: string;
  /** Annotations, positioned through `useRadarChart()`. */
  readonly children?: ReactNode;
}

export interface RadarChartContextValue {
  readonly cx: number;
  readonly cy: number;
  /** Radius of the centre circle, where every axis' `min` (or `max`, when flipped) sits. */
  readonly inner: number;
  /** Radius of the rim. */
  readonly outer: number;
  /** A metric's axis angle in radians, clockwise from the top. */
  readonly angleOf: (metricId: string) => number;
  /** Where a value lands on a metric's axis, clamped to it. */
  readonly pointAt: (metricId: string, value: number) => Point | undefined;
}
