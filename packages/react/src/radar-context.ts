import { createContext, useContext } from "react";
import type { RadarChartContextValue } from "./radar-types.js";

export const RadarChartContext = createContext<RadarChartContextValue | null>(null);

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
 * Throws outside a `<RadarChart>`: an annotation outside its chart is a
 * usage error worth seeing immediately, not a blank panel.
 */
export function useRadarChart(): RadarChartContextValue {
  const ctx = useContext(RadarChartContext);
  if (!ctx) throw new Error("@pitchkit/react: useRadarChart() must be used inside <RadarChart>.");
  return ctx;
}
