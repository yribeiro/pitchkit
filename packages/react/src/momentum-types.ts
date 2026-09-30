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
  /** Zero-based index into `periods`. */
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
   * One array of samples per period: `[firstHalf, secondHalf]`, with extra
   * time as two more. Samples can be at any interval, and a period's width is
   * set by its own minutes, so stoppage time widens a half.
   */
  readonly periods: readonly (readonly T[])[];
  /** Match minute the sample starts at. Fractional is fine. */
  readonly time: Accessor<T, number>;
  /** Signed: positive is the home side's pressure, negative the away side's. */
  readonly value: Accessor<T, number>;
  /**
   * Overrides a period's start or end, in match minutes. By default a period
   * starts at its nominal minute and ends at the later of its nominal end and
   * its last sample.
   */
  readonly periodRanges?: readonly (Partial<MomentumRange> | undefined)[];
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
  /** Match minute of the event. */
  readonly eventTime: Accessor<E, number>;
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
   * Match minute -> pixel, in whichever period contains it, or the nearest
   * one for a minute that falls in a gap between periods.
   */
  readonly scaleX: (minute: number) => number;
  readonly bars: readonly (readonly MomentumBar[])[];
}
