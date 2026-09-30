/**
 * The cartesian counterpart to `transform/types.ts`.
 *
 * Nothing here knows about a pitch. `PitchDimensions` encodes a provider's
 * coordinate system; a chart's coordinate system is just two independent
 * scales over a rectangle, so the two share no types and deliberately no
 * code (docs/decisions.md D23).
 */

/** Space reserved around the plot area for axis ticks, labels and end labels. */
export interface ChartPadding {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** The plot rectangle, in pixels, within a chart of `width` x `height`. */
export interface ChartFrame {
  readonly width: number;
  readonly height: number;
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly plotWidth: number;
  readonly plotHeight: number;
}

/**
 * A one-dimensional value -> pixel mapping.
 *
 * The y-axis flip lives here, in the *range* (`[y1, y0]` rather than
 * `[y0, y1]`), exactly as `yDirection` lives inside `PitchDimensions`
 * rather than in any caller. No component multiplies a data value by
 * anything; everything goes through a scale.
 */
export interface LinearScale {
  (value: number): number;
  readonly invert: (pixel: number) => number;
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
}
