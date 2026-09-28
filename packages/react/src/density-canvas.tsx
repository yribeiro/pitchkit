import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { renderDensityLayersToCanvas } from "@pitchkit/core";
import type { Layer } from "@pitchkit/core";
import { usePitchContext } from "./context.js";

export interface DensityCanvasProps {
  /** The single density layer to paint — `heatmap`, `positionalHeatmap`, `hexbin` or `kde`. */
  layer: Layer;
  /** Value of the canvas's `data-pitchkit-layer` attribute, so each layer type stays queryable. */
  name: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The shared `<canvas>`-inside-`<foreignObject>` plumbing behind every
 * Canvas-rendered layer (`<Heatmap>`, `<PositionalHeatmap>`, `<Hexbin>`,
 * `<KDE>`), painted imperatively via core's `renderDensityLayersToCanvas`
 * in an effect.
 *
 * Unlike the SVG layer components, none of these can be re-emitted as JSX
 * — Canvas has no declarative JSX equivalent, and dense raster data is
 * exactly the case core's hybrid SVG+Canvas architecture (docs/architecture.md#rendering-svg-and-canvas)
 * reserves Canvas for. The `<canvas>` itself renders server-side (empty),
 * but its pixels only appear after the client effect runs — a documented
 * client-only boundary.
 *
 * Wrapped in `<foreignObject>` since a raw `<canvas>` can't be a direct
 * child of `<svg>` — this keeps the layer inside the same SVG tree as the
 * pitch and every other layer, rather than needing a second,
 * separately-positioned DOM element.
 *
 * No effect dependency array (runs after every render) rather than
 * enumerating every field of a layer object that's rebuilt on each render
 * anyway — repainting a canvas is cheap and idempotent, so this avoids a
 * fragile, easily-stale dependency list.
 */
export function DensityCanvas({ layer, name, className, style }: DensityCanvasProps) {
  const { dimensions, viewport } = usePitchContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderDensityLayersToCanvas({ dimensions, viewport, layers: [layer] }, canvas);
  });

  return (
    <foreignObject x={0} y={0} width={viewport.width} height={viewport.height}>
      <canvas
        ref={canvasRef}
        data-pitchkit-layer={name}
        className={className}
        style={{ width: "100%", height: "100%", display: "block", ...style }}
      />
    </foreignObject>
  );
}
