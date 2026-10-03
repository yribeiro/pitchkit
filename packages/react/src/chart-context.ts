import { createContext, useContext } from "react";

/**
 * A non-pitch chart's context and the hook that reads it.
 *
 * The hook throws outside the chart rather than returning nothing: an
 * annotation rendered outside its chart is a usage error the developer
 * should see immediately, not debug from a blank panel.
 */
export function createChartContext<T>(chart: string) {
  const Context = createContext<T | null>(null);
  function use(): T {
    const value = useContext(Context);
    if (value === null) {
      throw new Error(`@pitchkit/react: this component must be rendered inside <${chart}>.`);
    }
    return value;
  }
  return { Context, use };
}
