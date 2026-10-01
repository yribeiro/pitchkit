import type { ReactNode } from "react";
import type { LabelRotation, Point } from "@pitchkit/core";
import type { PolarDetailProps, PolarMetric, PolarSeries } from "./polar-types.js";

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

export interface RadarChartProps extends PolarDetailProps {
  /** The axes, clockwise from the top. Each has its own range; at least three. */
  readonly metrics: readonly PolarMetric[];
  /** One shape per series. Readable up to three; more draws, with a development warning. */
  readonly series: readonly PolarSeries[];
  /** Range rings between the centre circle and the rim. @default 4 */
  readonly rings?: number;
  /** How metric labels and ring values sit around the rim. @default "tangent" */
  readonly labelRotation?: LabelRotation;
  /** Text for ring values and the readout. Defaults to at most two decimals. */
  readonly format?: (value: number, metric: PolarMetric) => string;

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
