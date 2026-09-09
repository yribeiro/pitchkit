import type { CSSProperties } from "react";
import type { PositionalHeatmapLayer } from "@pitchkit/core";
import { DensityCanvas } from "./density-canvas.js";

export interface PositionalHeatmapProps<T> extends Omit<PositionalHeatmapLayer<T>, "type"> {
  className?: string;
  style?: CSSProperties;
}

/**
 * Client-only `<canvas>` heatmap binned into Juego de Posición zones —
 * mplsoccer's `bin_statistic_positional` + `heatmap_positional`. Same
 * aggregation as `<Heatmap>`, but the cells come from the pitch markings
 * (penalty areas, six-yard boxes, halfway line) rather than a uniform
 * grid, which is what makes zone-to-zone comparisons meaningful to an
 * analyst reading positional play.
 *
 * Pass `stroke` to outline the zones — off by default, since the
 * boundaries compete with the pitch markings they're derived from.
 */
export function PositionalHeatmap<T>({
  className,
  style,
  ...layerProps
}: PositionalHeatmapProps<T>) {
  return (
    <DensityCanvas
      layer={{ type: "positionalHeatmap", ...layerProps }}
      name="positional-heatmap"
      className={className}
      style={style}
    />
  );
}
