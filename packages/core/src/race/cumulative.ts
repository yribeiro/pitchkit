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
  readonly time: number;
  readonly value: number;
  /** Drawn with the larger ringed marker. For xG this is "was a goal". */
  readonly emphasis?: boolean;
}

/** One event with its running total attached. */
export interface RacePoint {
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
 * Turns events into a running total, sorted by time.
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
 * value should lose that shot, not the rest of the match.
 */
export function computeCumulativeSeries(events: readonly RaceEvent[]): RaceSeriesData {
  const usable = events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => Number.isFinite(event.time) && Number.isFinite(event.value));

  // Ties broken by original index keeps the sort stable across engines, so
  // two shots in the same minute always step in feed order.
  usable.sort((a, b) => a.event.time - b.event.time || a.index - b.index);

  let running = 0;
  const points = usable.map(({ event, index }) => {
    running += event.value;
    return {
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
 * The cumulative value of a series at `time`.
 *
 * Step-after semantics: the value at time *t* is the running total of the
 * last event at or before *t*. Before the first event that is 0 (the
 * kick-off anchor); after the last it is the final total, out to full time.
 *
 * Binary search rather than a scan because this is called once per series
 * per pointer move by the crosshair, not once per render.
 */
export function valueAtTime(points: readonly RacePoint[], time: number): number {
  let lo = 0;
  let hi = points.length - 1;
  let found = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const point = points[mid] as RacePoint;
    if (point.time <= time) {
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
