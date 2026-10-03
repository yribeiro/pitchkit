import { createChartContext } from "./chart-context.js";
import type { PizzaChartContextValue } from "./pizza-types.js";

const pizza = createChartContext<PizzaChartContextValue>("PizzaChart");

export const PizzaChartContext = pizza.Context;

/**
 * The pizza's geometry — the `<PizzaChart>` counterpart to `usePitch()`.
 * `pointAt(metricId, value)` puts a mark on a slice's middle using the same
 * range and flip as the slices, so a benchmark lines up:
 *
 * ```tsx
 * function Median({ metricId }: { metricId: string }) {
 *   const { pointAt } = usePizzaChart();
 *   const [x, y] = pointAt(metricId, 50) ?? [];
 *   return x === undefined ? null : <circle cx={x} cy={y} r={3} fill="currentColor" />;
 * }
 * ```
 *
 * Throws outside a `<PizzaChart>`.
 */
export const usePizzaChart: () => PizzaChartContextValue = pizza.use;
