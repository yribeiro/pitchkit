import { groupByPeriod, isPeriod } from "../chart/periods.js";
import type { MomentumRange } from "../momentum/bars.js";
import { resolvePeriodRange } from "../momentum/layout.js";

/**
 * One event feeding a race chart, already resolved from its accessors.
 *
 * Core deliberately takes plain numbers rather than `Accessor`s: accessors
 * are a React-binding ergonomic, and keeping them out of here means the
 * race module has no dependency on `scene/` — the one module whose whole
 * point is not knowing about a pitch would otherwise import from the one
 * that is entirely about pitches.
 */
export interface RaceEvent {
  /**
   * The period's number, 1 for the first half. Required because minutes
   * restart at 45 for the second half: without it, first-half stoppage time
   * and the start of the second half are the same minutes.
   */
  readonly period: number;
  /** Match minute, as the feed numbers it. */
  readonly time: number;
  readonly value: number;
  /** Drawn with the larger ringed marker. For xG this is "was a goal". */
  readonly emphasis?: boolean;
}

/** One event with its running total attached. */
export interface RacePoint {
  readonly period: number;
  readonly time: number;
  readonly value: number;
  readonly cumulative: number;
  readonly emphasis: boolean;
  /** Index into the caller's original array, so a tooltip can find its datum. */
  readonly index: number;
}

export interface RaceSeriesData {
  readonly points: readonly RacePoint[];
  readonly total: number;
}

/**
 * Turns events into a running total, in match order: by period, then by
 * minute within it.
 *
 * What this deliberately does *not* do is synthesise the kick-off and
 * full-time anchors. Those are a rendering concern (`stepPath` adds them),
 * and keeping them out of `points` means every point corresponds to a real
 * datum — so markers and tooltips map one-to-one onto the caller's array
 * and never have to special-case two phantom entries.
 *
 * Events arrive unsorted often enough to be the default assumption: a
 * StatsBomb feed is in event order, which is chronological per period but
 * interleaves the two teams, and filtering one team out leaves gaps rather
 * than disorder. Sorting anyway costs nothing and removes a class of bug
 * where a late-arriving event draws a step backwards.
 *
 * Non-finite values are dropped rather than propagated: one `NaN` in a
 * running sum poisons every point after it, and an xG feed with a missing
 * value should lose that shot, not the rest of the match. So is an event
 * whose period isn't a whole number from 1, which has nowhere to be drawn.
 */
export function computeCumulativeSeries(events: readonly RaceEvent[]): RaceSeriesData {
  const usable = events
    .map((event, index) => ({ event, index }))
    .filter(
      ({ event }) =>
        isPeriod(event.period) && Number.isFinite(event.time) && Number.isFinite(event.value),
    );

  // Ties broken by original index keeps the sort stable across engines, so
  // two shots in the same minute always step in feed order.
  usable.sort(
    (a, b) => a.event.period - b.event.period || a.event.time - b.event.time || a.index - b.index,
  );

  let running = 0;
  const points = usable.map(({ event, index }) => {
    running += event.value;
    return {
      period: event.period,
      time: event.time,
      value: event.value,
      cumulative: running,
      emphasis: event.emphasis === true,
      index,
    };
  });

  return { points, total: running };
}

/**
 * The cumulative value of a series at `time` in `period`.
 *
 * Step-after semantics: the value at time *t* is the running total of the
 * last event at or before *t*, counting every event in an earlier period
 * whatever its minute. Before the first event that is 0 (the
 * kick-off anchor); after the last it is the final total, out to full time.
 *
 * Binary search rather than a scan because this is called once per series
 * per pointer move by the crosshair, not once per render.
 */
export function valueAtTime(points: readonly RacePoint[], time: number, period: number): number {
  let lo = 0;
  let hi = points.length - 1;
  let found = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const point = points[mid] as RacePoint;
    if (point.period < period || (point.period === period && point.time <= time)) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return found === -1 ? 0 : (points[found] as RacePoint).cumulative;
}

/**
 * Where the axis should end, in minutes.
 *
 * Floored at 90 so a quiet match doesn't end its axis at the last shot,
 * and raised to the data's own extent so extra time isn't clipped —
 * knockout matches genuinely reach minute 121, and a fixed 90 would cut a
 * third of them off (docs/architecture.md, data provider facts).
 */
export function resolveEndTime(latestTime: number, minimum = 90): number {
  if (!Number.isFinite(latestTime)) return minimum;
  return Math.max(minimum, Math.ceil(latestTime));
}

/**
 * Each period's range in match minutes, for laying a race chart out one
 * period after another (`layoutMomentumPanels` with no gap).
 *
 * Every period from the first to the latest one seen gets a range, so a
 * quiet period still has somewhere to be, and there are always at least
 * two halves. Each range is its nominal one extended to its own last event
 * (`resolvePeriodRange`), so stoppage time widens its own half rather than
 * the next one. `endTime`, when given, sets where the last period ends.
 */
export function racePeriodRanges(
  events: readonly Pick<RaceEvent, "period" | "time">[],
  endTime?: number,
): MomentumRange[] {
  const usable = events.filter(({ time }) => Number.isFinite(time));
  const ranges = groupByPeriod(usable.map((event) => event.period)).map((indices, index) => {
    const times = indices.map((i) => (usable[i] as RaceEvent).time);
    return resolvePeriodRange(index, times.length > 0 ? Math.max(...times) : undefined);
  });
  const count = ranges.length;
  const last = ranges[count - 1] as MomentumRange;
  if (endTime !== undefined && Number.isFinite(endTime)) {
    ranges[count - 1] = { start: last.start, end: endTime };
  }
  return ranges;
}
