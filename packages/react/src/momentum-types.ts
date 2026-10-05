import type { ReactNode } from "react";
import type {
  Accessor,
  ChartFrame,
  ChartPadding,
  LinearScale,
  MomentumBar,
  MomentumPanel,
  MomentumRange,
} from "@pitchkit/core";

/** Which side of the pitch an event or a bar belongs to. Home is drawn up, away down. */
export type MomentumSide = "home" | "away";

/**
 * The kinds of event `<MomentumChart>` draws an icon for. Anything else is a
 * child, positioned through `useMomentumChart()`.
 *
 * `goal` includes a scored penalty, which most feeds record as a goal.
 * `red-card` and `own-goal` are drawn in the card red, since their meaning
 * is their colour; every other icon takes its team's colour.
 */
export type MomentumEventKind =
  "goal" | "own-goal" | "missed-penalty" | "yellow-card" | "red-card" | "substitution" | "var";

export interface MomentumTeams {
  readonly home: string;
  readonly away: string;
}

/** Structure only — never colour, per `docs/decisions.md` D8. */
export interface MomentumAppearance {
  /** Minute ticks under each period. @default true */
  readonly axis?: boolean;
  /** Which colour and direction is which team; drawn when `teams` is given. @default true */
  readonly legend?: boolean;
}

/** What a readout is about: the minute under the pointer and what is there. */
export interface MomentumHover<T, E> {
  readonly minute: number;
  /** The hovered period's number: 1 for the first half. */
  readonly period: number;
  /** The bar under the pointer, or `undefined` in a stretch with no data. */
  readonly bar: MomentumBar | undefined;
  /** The caller's datum behind that bar. */
  readonly datum: T | undefined;
  /** Events at that minute. */
  readonly events: readonly E[];
}

interface MomentumBaseProps<T, E> {
  /**
   * Every sample, in one list, each tagged with its period by `period`: the
   * shape a feed gives. Samples can be at any interval and in any order, and
   * a period's width is set by its own minutes, so stoppage time widens a half.
   */
  readonly data: readonly T[];
  /** Match minute the sample starts at, as the feed numbers it. Fractional is fine. */
  readonly time: Accessor<T, number>;
  /**
   * The period the sample is in: 1 for the first half, 2 for the second, 3
   * and 4 for extra time. StatsBomb's `period` is already this.
   *
   * Each period is its own panel. Every period from 1 to the highest one in
   * the data gets one, at least two, so an empty period keeps its place. A
   * sample without a whole-number period from 1 is dropped.
   */
  readonly period: Accessor<T, number>;
  /** Signed: positive is the home side's pressure, negative the away side's. */
  readonly value: Accessor<T, number>;
  /**
   * Overrides a period's start or end, in match minutes, keyed by period
   * number: `{ 2: { end: 95 } }`. By default a period starts at its nominal
   * minute and ends at the later of its nominal end and its last sample.
   */
  readonly periodRanges?: Readonly<Record<number, Partial<MomentumRange>>>;
  /** Half the value axis. Defaults to the largest magnitude, rounded up. */
  readonly maxValue?: number;

  readonly teams?: MomentumTeams;

  /** Fixed pixel size — the opt-out from the responsive default. Provide both, or neither. */
  readonly width?: number;
  readonly height?: number;
  /** Shape of the responsive box. @default 3, or 1.8 below 420px wide */
  readonly aspectRatio?: number;
  readonly padding?: ChartPadding;

  readonly appearance?: MomentumAppearance;
  /** Replaces the default readout body. */
  readonly tooltip?: (hover: MomentumHover<T, E>) => ReactNode;
  readonly className?: string;
  /** Annotations, positioned through `useMomentumChart()`. */
  readonly children?: ReactNode;
}

interface MomentumEventProps<E> {
  readonly events: readonly E[];
  /** Match minute of the event, as the feed numbers it. */
  readonly eventTime: Accessor<E, number>;
  /**
   * The period the event happened in, numbered like the samples' `period`:
   * 1 for the first half. StatsBomb's `period` is already this.
   *
   * Required because minutes restart at 45 for the second half: a minute
   * like 46' is in both halves when the first had stoppage time. An event
   * in a period the chart has no panel for is not drawn.
   */
  readonly eventPeriod: Accessor<E, number>;
  readonly eventSide: Accessor<E, MomentumSide>;
  readonly eventKind: Accessor<E, MomentumEventKind>;
  /** Text for the readout and for screen readers. Defaults to the kind. */
  readonly eventLabel?: Accessor<E, string>;
}

interface NoMomentumEventProps {
  readonly events?: undefined;
}

/**
 * The events props come as a set: passing `events` requires the accessors
 * that say when, for whom and what, so a typo is a compile error rather than
 * an empty icon row.
 */
export type MomentumChartProps<T, E = never> = MomentumBaseProps<T, E> &
  (MomentumEventProps<E> | NoMomentumEventProps);

export interface MomentumChartContextValue {
  /** The bars' plot rectangle, in pixels. */
  readonly frame: ChartFrame;
  readonly panels: readonly MomentumPanel[];
  /** Value -> pixel, symmetric about the zero line, already flipped for SVG. */
  readonly scaleY: LinearScale;
  /**
   * Match minute -> pixel, in the given period (1 for the first half). A
   * minute outside that period is clamped to its edge.
   */
  readonly scaleX: (minute: number, period: number) => number;
  /** One list per period, `bars[period - 1]`. A bar's `index` points into `data`. */
  readonly bars: readonly (readonly MomentumBar[])[];
}
