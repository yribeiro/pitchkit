import type { CSSProperties } from "react";
import type { HexbinLayer } from "@pitchkit/core";
import { DensityCanvas } from "./density-canvas.js";

export interface HexbinProps<T> extends Omit<HexbinLayer<T>, "type"> {
  className?: string;
  style?: CSSProperties;
}

/**
 * Client-only `<canvas>` hexagonal density — mplsoccer's `hexbin`.
 * Hexagons pack more evenly than squares (every neighbour is equidistant),
 * so dense touch/event data reads with less of the axis-aligned banding a
 * rectangular `<Heatmap>` shows. Empty hexagons aren't drawn at all, so
 * the pitch stays visible wherever there's no data.
 */
export function Hexbin<T>({ className, style, ...layerProps }: HexbinProps<T>) {
  return (
    <DensityCanvas
      layer={{ type: "hexbin", ...layerProps }}
      name="hexbin"
      className={className}
      style={style}
    />
  );
}
