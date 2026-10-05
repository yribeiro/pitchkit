import type { ReactNode } from "react";
import type { Accessor, ChartPadding } from "@pitchkit/core";

/** One line on the chart: a team, a player, whatever accumulates. */
export interface RaceSeries<T> {
  /** Stable identity — what `valueAt` takes, and what colour follows. */
  readonly id: string;
  /** Legend and end-label text. Defaults to `id`. */
  readonly label?: string;
  readonly data: readonly T[];
  /**
   * Usually a `var()` reference. Defaults to `--pitch-series-N` by the
   * series' position, so colour follows the entity rather than its rank:
   * removing a series never repaints the survivors.
   */
  readonly color?: string;
  /** Styling escape hatch; drops the themed default, as on every mark layer. */
  readonly className?: string;
}

/**
 * Structure only — never colour, per `docs/decisions.md` D8. Everything
 * here answers "is this drawn", not "what colour is it".
 */
export interface RaceAppearance {
  /** @default "both" */
  readonly axis?: "both" | "x" | "y" | "none";
  /** @default true */
  readonly grid?: boolean;
  /** Shading under each line, at ~10% of the series hue. @default false */
  readonly area?: boolean;
  /** Which points get a dot. @default "emphasis" */
  readonly markers?: "emphasis" | "all" | "none";
  /** Period-boundary rules, labelled HT, P3, P4. @default true */
  readonly periods?: boolean;
  /** Each series' total, printed at its line end. @default true */
  readonly endLabels?: boolean;
  /** @default true for two or more series, false for one */
  readonly legend?: boolean;
}

/** One row of the crosshair tooltip. */
export interface RaceHoverRow {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly value: number;
}

export interface RaceChartProps<T> {
  readonly series: readonly RaceSeries<T>[];
  /** Match minute, as the feed numbers it. Fractional is fine — `(s) => s.minute + s.second / 60`. */
  readonly time: Accessor<T, number>;
  /**
   * The period the datum is in: 1 for the first half, 2 for the second, 3
   * and 4 for extra time. StatsBomb's `period` is already this.
   *
   * Required because minutes restart at 45 for the second half: a minute
   * like 46' is in both halves when the first had stoppage time. Each
   * period is drawn after the one before it, as wide as its own minutes.
   * A datum without a whole-number period from 1 is dropped.
   */
  readonly period: Accessor<T, number>;
  /** The quantity that accumulates. For an xG race, the shot's xG. */
  readonly value: Accessor<T, number>;
  /** Drawn with the larger ringed marker. For an xG race, pass `isGoal`. */
  readonly emphasise?: Accessor<T, boolean>;

  /**
   * Where the last period ends, in match minutes. Defaults to its nominal
   * end (90, or 120 after extra time), or later if its data runs on. Data
   * after an explicit `endTime` is dropped, from the line and the total.
   */
  readonly endTime?: number;
  /** Top of the y-axis. Defaults to a round ceiling above the highest total. */
  readonly maxValue?: number;

  /** Fixed pixel size — the opt-out from the responsive default. Provide both, or neither. */
  readonly width?: number;
  readonly height?: number;
  /** Shape of the responsive box. @default 2, or 1.4 below 420px wide */
  readonly aspectRatio?: number;
  readonly padding?: ChartPadding;

  readonly appearance?: RaceAppearance;
  /** Replaces the default crosshair tooltip body. `period` is 1 for the first half. */
  readonly tooltip?: (rows: readonly RaceHoverRow[], time: number, period: number) => ReactNode;
  readonly className?: string;
  /** Annotations, positioned through `useRaceChart()`. */
  readonly children?: ReactNode;
}
