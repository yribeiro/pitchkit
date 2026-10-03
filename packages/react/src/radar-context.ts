import { createChartContext } from "./chart-context.js";
import type { RadarChartContextValue } from "./radar-types.js";

const radar = createChartContext<RadarChartContextValue>("RadarChart");

export const RadarChartContext = radar.Context;

/**
 * The radar's geometry — the `<RadarChart>` counterpart to `usePitch()`.
 * `pointAt(metricId, value)` puts a mark on an axis using the same range
 * and flip as the shapes, so a benchmark or a league average lines up:
 *
 * ```tsx
 * function Average({ values }: { values: Record<string, number> }) {
 *   const { pointAt } = useRadarChart();
 *   const points = Object.entries(values).flatMap(([id, v]) => pointAt(id, v) ?? []);
 *   return <polygon points={points.join(" ")} fill="none" strokeDasharray="3 3" stroke="currentColor" />;
 * }
 * ```
 *
 * Throws outside a `<RadarChart>`.
 */
export const useRadarChart: () => RadarChartContextValue = radar.use;
