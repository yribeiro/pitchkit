import type { Scene } from "../scene/types.js";

/**
 * A layer declares *what* to draw; the renderer decides SVG vs Canvas
 * (PRD §8.1). Only the SVG implementation ships in M0 — Canvas arrives in
 * Milestone 1 alongside the Heatmap layer.
 */
export interface Renderer<TOutput> {
  render(scene: Scene): TOutput;
}
