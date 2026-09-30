/**
 * Stacks markers that would overlap into lanes.
 *
 * Events cluster: a goal, a booking and a substitution inside the same
 * minute all want the same spot on a one-row icon strip. Each marker takes
 * the first lane whose last marker is at least `minSpacing` pixels left of
 * it, so lane 0 is used whenever it can be and a crowded minute fans out
 * downwards rather than overprinting.
 *
 * `maxLanes` stops a busy match from growing the strip without bound: eight
 * substitutions would otherwise cost four rows of a chart that has a few
 * dozen pixels to spare. Once every lane is taken a marker joins the lane
 * whose last marker is furthest behind, which overlaps it by the least, so
 * a capped strip degrades to a little overprinting rather than to a tall one.
 *
 * Returns a lane per input, in the input's order, so the caller doesn't
 * have to sort to use it.
 */
export function assignLanes(
  xs: readonly number[],
  minSpacing: number,
  maxLanes = Number.POSITIVE_INFINITY,
): number[] {
  const cap = Math.max(1, maxLanes);
  const order = xs.map((x, index) => ({ x, index })).sort((a, b) => a.x - b.x || a.index - b.index);
  const lastX: number[] = [];
  const lanes = new Array<number>(xs.length).fill(0);

  for (const { x, index } of order) {
    let lane = lastX.findIndex((last) => x - last >= minSpacing);
    if (lane === -1) {
      lane = lastX.length < cap ? lastX.length : lastX.indexOf(Math.min(...lastX));
    }
    lastX[lane] = x;
    lanes[index] = lane;
  }
  return lanes;
}
