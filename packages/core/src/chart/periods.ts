/**
 * A period number that can be drawn: a whole number from 1, the way feeds
 * number them (1 for the first half, 2 for the second, 3 and 4 for extra
 * time).
 */
export function isPeriod(period: number): boolean {
  return Number.isInteger(period) && period >= 1;
}

/**
 * Indices into a flat list, grouped by period: `groups[n - 1]` holds the
 * indices of everything in period *n*, in list order.
 *
 * Feeds tag every row with its period rather than splitting them, so the
 * charts take one flat list and group it here. Every period from 1 to the
 * highest one seen gets a group, at least `minimum` of them, so a period
 * with no rows still has its slot and the ones after it stay numbered
 * right. Rows whose period isn't a whole number from 1 are left out.
 */
export function groupByPeriod(periods: readonly number[], minimum = 2): number[][] {
  let count = minimum;
  for (const period of periods) if (isPeriod(period)) count = Math.max(count, period);

  const groups = Array.from({ length: count }, (): number[] => []);
  periods.forEach((period, index) => {
    if (isPeriod(period)) (groups[period - 1] as number[]).push(index);
  });
  return groups;
}
