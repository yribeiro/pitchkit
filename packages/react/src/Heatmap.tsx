import type { CSSProperties } from "react";
import type { HeatmapLayer } from "@pitchkit/core";
import { DensityCanvas } from "./density-canvas.js";

export interface HeatmapProps<T> extends Omit<HeatmapLayer<T>, "type"> {
  /**
   * Every bin gets painted (from `colorMin` to `colorMax`, including
   * zero-value bins) rather than leaving low bins transparent, so a
   * heatmap fully covers the pitch underneath by default. Set an opacity
   * here (or a blend mode) to let the pitch show through.
   */
  className?: string;
  style?: CSSProperties;
}

/**
 * Client-only `<canvas>` heatmap: bins `data` into a uniform
 * `binsX` x `binsY` grid and colours each cell by count (or summed
 * `weight`). See `DensityCanvas` for why every Canvas layer is painted
 * imperatively rather than re-emitted as JSX.
 */
export function Heatmap<T>({ className, style, ...layerProps }: HeatmapProps<T>) {
  return (
    <DensityCanvas
      layer={{ type: "heatmap", ...layerProps }}
      name="heatmap"
      className={className}
      style={style}
    />
  );
}
