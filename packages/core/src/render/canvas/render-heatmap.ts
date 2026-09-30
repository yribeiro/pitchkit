import type { Scene } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import type { Renderer } from "../renderer.js";
import { paintHeatmapLayer } from "./paint-heatmap.js";
import { paintHexbinLayer } from "./paint-hexbin.js";
import { paintKdeLayer } from "./paint-kde.js";
import { paintPositionalHeatmapLayer } from "./paint-positional.js";

export interface RenderHeatmapOptions {
  /** Defaults to `window.devicePixelRatio` (falling back to 1 if unavailable). */
  readonly devicePixelRatio?: number;
}

/**
 * Paints every density-type layer in a Scene (`heatmap`,
 * `positionalHeatmap`, `hexbin`, `kde`) onto a 2D canvas, ignoring every
 * other layer type — the SVG renderer handles those. Backs the canvas at
 * `cssSize x devicePixelRatio` physical pixels and scales the drawing
 * context accordingly (docs/architecture.md#responsive-and-multi-device), so dense layers stay crisp on retina
 * displays without every painter needing to know about DPR itself.
 *
 * Does not attempt to composite with the SVG renderer's output — stacking
 * the resulting canvas with an `<svg>` in the DOM is a consumer concern
 * (`@pitchkit/react`'s), not core's.
 */
export function renderDensityLayersToCanvas(
  scene: Scene,
  canvas: HTMLCanvasElement,
  options: RenderHeatmapOptions = {},
): void {
  const dpr =
    options.devicePixelRatio ?? (typeof window !== "undefined" ? window.devicePixelRatio : 1) ?? 1;
  const { width, height } = scene.viewport;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return; // no 2D context available (e.g. unsupported environment) — nothing to paint

  // setTransform (not scale) so repeated renders on the same canvas don't
  // compound the DPR scale on top of itself.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const transform = createPixelTransform(scene.dimensions, scene.viewport);

  for (const layer of scene.layers) {
    switch (layer.type) {
      case "heatmap":
        paintHeatmapLayer(ctx, layer, scene.dimensions, transform);
        break;
      case "positionalHeatmap":
        paintPositionalHeatmapLayer(ctx, layer, scene.dimensions, transform);
        break;
      case "hexbin":
        paintHexbinLayer(ctx, layer, scene.dimensions, transform);
        break;
      case "kde":
        paintKdeLayer(ctx, layer, scene.dimensions, transform);
        break;
    }
  }
}

/**
 * The original name for `renderDensityLayersToCanvas`, from when `heatmap`
 * was the only Canvas-rendered layer. Kept as an alias because it shipped
 * in `@pitchkit/core@0.1.0`'s public API — it paints every density layer,
 * not just heatmaps.
 */
export const renderHeatmapLayersToCanvas = renderDensityLayersToCanvas;

/** Concrete `Renderer` implementation backed by the Canvas density path. */
export const canvasRenderer: Renderer<HTMLCanvasElement> = {
  render: (scene: Scene): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    renderDensityLayersToCanvas(scene, canvas);
    return canvas;
  },
};
