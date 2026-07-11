import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { renderHeatmapLayersToCanvas } from "@pitchkit/core";
import type { HeatmapLayer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

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
 * Client-only `<canvas>` heatmap, painted imperatively via core's
 * `renderHeatmapLayersToCanvas` in an effect. Unlike the SVG layer
 * components, this can't be re-emitted as JSX — Canvas has no declarative
 * JSX equivalent, and dense raster data is exactly the case core's hybrid
 * SVG+Canvas architecture (PRD §8.1) reserves Canvas for. The `<canvas>`
 * itself renders server-side (empty), but its pixels only appear after the
 * client effect runs — a documented client-only boundary.
 *
 * Wrapped in `<foreignObject>` since a raw `<canvas>` can't be a direct
 * child of `<svg>` — this keeps the heatmap inside the same SVG tree as
 * the pitch and every other layer, rather than needing a second,
 * separately-positioned DOM element the way the vanilla-JS core example
 * demo has to (core has no JSX to lean on there).
 *
 * No effect dependency array (runs after every render) rather than
 * enumerating every spread `props` field plus `dimensions`/`viewport` —
 * repainting a canvas is cheap and idempotent, so this avoids a fragile,
 * easily-stale dependency list.
 */
export function Heatmap<T>({ className, style, ...layerProps }: HeatmapProps<T>) {
  const { dimensions, viewport } = usePitchContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderHeatmapLayersToCanvas(
      { dimensions, viewport, layers: [{ type: "heatmap", ...layerProps }] },
      canvas,
    );
  });

  return (
    <foreignObject x={0} y={0} width={viewport.width} height={viewport.height}>
      <canvas
        ref={canvasRef}
        data-pitchkit-layer="heatmap"
        className={className}
        style={{ width: "100%", height: "100%", display: "block", ...style }}
      />
    </foreignObject>
  );
}
