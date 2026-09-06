import type { Scene } from "../scene/types.js";

/**
 * A layer declares *what* to draw; the renderer decides SVG vs Canvas
 * (PRD §8.1).
 *
 * @internal `svgRenderer` (the SVG implementation of this interface) is
 * internal building-block surface, not a supported public consumption path
 * — see the note on `svgRenderer` in `render/svg/render-scene.ts` (resolves
 * issue #6). `canvasRenderer` for heatmaps is unaffected: `@pitchkit/react`'s
 * `<Heatmap>` calls into it directly and it remains fully supported.
 */
export interface Renderer<TOutput> {
  render(scene: Scene): TOutput;
}
