/**
 * Offsets markers that would overlap so they fan out instead of overprinting.
 *
 * Events cluster: a goal, a booking and a substitution inside the same
 * minute all want the same spot on a one-row icon strip. Rather than add
 * rows, a crowded run is spread into a shallow stack: each marker sits
 * `step` pixels right of the one before it, and a later one paints over an
 * earlier one, like a hand of cards.
 *
 * A marker that is already at least `size` pixels from the last one is left
 * exactly where it is. A run that had to move is then re-centred on where
 * its markers really were, so a stack straddles its minute rather than
 * drifting off to one side of it.
 *
 * Returns an x per input, in the input's order, so the caller doesn't have
 * to sort to use it. Paint in ascending x to get the stacking the layout
 * assumes.
 */
export function stackOffsets(xs: readonly number[], size: number, step: number): number[] {
  const order = xs.map((x, index) => ({ x, index })).sort((a, b) => a.x - b.x || a.index - b.index);
  const placed = new Array<number>(xs.length).fill(0);

  // A run is a maximal stretch of markers each too close to the last.
  const runs: { index: number; x: number }[][] = [];
  let last = Number.NEGATIVE_INFINITY;
  for (const { x, index } of order) {
    const crowded = x - last < size && runs.length > 0;
    const at = crowded ? Math.max(x, last + step) : x;
    if (crowded) {
      (runs[runs.length - 1] as { index: number; x: number }[]).push({ index, x });
    } else {
      runs.push([{ index, x }]);
    }
    placed[index] = at;
    last = at;
  }

  for (const run of runs) {
    if (run.length < 2) continue;
    const drift = run.reduce((sum, { index, x }) => sum + (placed[index] as number) - x, 0);
    const shift = drift / run.length;
    for (const { index } of run) placed[index] = (placed[index] as number) - shift;
  }
  return placed;
}
