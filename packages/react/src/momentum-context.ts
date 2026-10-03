import { createContext, useContext } from "react";
import type { MomentumChartContextValue } from "./momentum-types.js";

export const MomentumChartContext = createContext<MomentumChartContextValue | null>(null);

/**
 * Internal: the chart's own children read scales through this. Throws
 * rather than rendering nothing, for the same reason `usePitchContext`
 * does — "annotation outside its chart" is a usage error the consumer
 * should see immediately, not debug from a blank panel.
 */
export function useMomentumChartContext(): MomentumChartContextValue {
  const ctx = useContext(MomentumChartContext);
  if (!ctx) {
    throw new Error("@pitchkit/react: this component must be rendered inside <MomentumChart>.");
  }
  return ctx;
}
