import type { CSSProperties } from "react";
import type { KdeLayer } from "@pitchkit/core";
import { DensityCanvas } from "./density-canvas.js";

export interface KDEProps<T> extends Omit<KdeLayer<T>, "type"> {
  className?: string;
  style?: CSSProperties;
}

/**
 * Client-only `<canvas>` kernel density estimate — mplsoccer's `kdeplot`.
 * Unlike the binned layers, each point spreads influence over its
 * neighbourhood, so the result is a continuous surface rather than a grid
 * of cells, and low-density areas fade out instead of being filled with
 * `colorMin`.
 *
 * `bandwidth` controls the smoothing radius in provider units; leave it
 * unset to let Silverman's rule of thumb pick one per axis from the data's
 * own spread.
 */
export function KDE<T>({ className, style, ...layerProps }: KDEProps<T>) {
  return (
    <DensityCanvas
      layer={{ type: "kde", ...layerProps }}
      name="kde"
      className={className}
      style={style}
    />
  );
}
