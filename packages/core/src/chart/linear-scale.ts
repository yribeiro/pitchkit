import type { LinearScale } from "./types.js";

/**
 * Builds a linear value -> pixel mapping over `domain` and `range`.
 *
 * `range` is given in draw order, so a y-scale is constructed with its
 * range reversed (`[bottomPx, topPx]`) and the SVG y-flip falls out of the
 * arithmetic rather than being re-derived at every call site.
 *
 * A degenerate domain (every value identical, including the all-zero case
 * a scoreless race chart produces) maps everything to `range[0]`. For a
 * y-scale that is the baseline, which is where a flat zero line belongs;
 * returning `NaN` from the division, or splitting the difference to the
 * middle of the range, would both draw a line the data doesn't support.
 */
export function createLinearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const domainSpan = d1 - d0;

  const scale = ((value: number): number => {
    if (domainSpan === 0) return r0;
    return r0 + ((value - d0) / domainSpan) * (r1 - r0);
  }) as {
    (value: number): number;
    invert: (pixel: number) => number;
    domain: readonly [number, number];
    range: readonly [number, number];
  };

  scale.invert = (pixel: number): number => {
    const rangeSpan = r1 - r0;
    if (rangeSpan === 0) return d0;
    return d0 + ((pixel - r0) / rangeSpan) * domainSpan;
  };
  scale.domain = domain;
  scale.range = range;

  return scale;
}
