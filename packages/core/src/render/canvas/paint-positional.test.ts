import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { PositionalHeatmapLayer } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import type { Viewport } from "../../transform/types.js";
import { paintPositionalHeatmapLayer } from "./paint-positional.js";

interface RectCall {
  fillStyle: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Same technique as paint-heatmap.test.ts — happy-dom has no real 2D canvas. */
function createMockContext(): {
  ctx: CanvasRenderingContext2D;
  fills: RectCall[];
  strokes: RectCall[];
} {
  const fills: RectCall[] = [];
  const strokes: RectCall[] = [];
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    fillRect(x: number, y: number, width: number, height: number) {
      fills.push({ fillStyle: ctx.fillStyle, x, y, width, height });
    },
    strokeRect(x: number, y: number, width: number, height: number) {
      strokes.push({ fillStyle: ctx.strokeStyle, x, y, width, height });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills, strokes };
}

const dimensions = PITCH_DIMENSIONS.statsbomb; // 120 x 80
const viewport: Viewport = { width: 600, height: 400, orientation: "horizontal" };
const transform = createPixelTransform(dimensions, viewport); // scale = 5, no offset

function layer(
  overrides: Partial<PositionalHeatmapLayer<{ x: number; y: number }>> = {},
): PositionalHeatmapLayer<{ x: number; y: number }> {
  return {
    type: "positionalHeatmap",
    data: [],
    x: (d) => d.x,
    y: (d) => d.y,
    ...overrides,
  };
}

describe("paintPositionalHeatmapLayer", () => {
  it("issues exactly one fillRect per zone", () => {
    const { ctx, fills } = createMockContext();
    paintPositionalHeatmapLayer(ctx, layer({ data: [{ x: 60, y: 40 }] }), dimensions, transform);
    expect(fills).toHaveLength(20);
  });

  it("places the left penalty zone at the transformed pitch coordinates", () => {
    const { ctx, fills } = createMockContext();
    paintPositionalHeatmapLayer(ctx, layer(), dimensions, transform);
    // penalty-left is x 0..18, y 18..62 in provider units; scale is 5.
    const penalty = fills.find((f) => f.x === 0 && f.y === 90);
    expect(penalty).toMatchObject({ width: 90, height: 220 });
  });

  it("colors the busiest zone with colorMax and an empty one with colorMin", () => {
    const { ctx, fills } = createMockContext();
    paintPositionalHeatmapLayer(
      ctx,
      layer({ data: [{ x: 5, y: 40 }], colorMin: "#000000", colorMax: "#ffffff" }),
      dimensions,
      transform,
    );
    expect(fills.some((f) => f.fillStyle === "rgb(255, 255, 255)")).toBe(true);
    expect(fills.some((f) => f.fillStyle === "rgb(0, 0, 0)")).toBe(true);
  });

  it("draws no zone outlines unless a stroke is given", () => {
    const { ctx, strokes } = createMockContext();
    paintPositionalHeatmapLayer(ctx, layer(), dimensions, transform);
    expect(strokes).toHaveLength(0);
  });

  it("outlines every zone when a stroke is given", () => {
    const { ctx, strokes } = createMockContext();
    paintPositionalHeatmapLayer(
      ctx,
      layer({ stroke: "#ffffff", strokeWidth: 2 }),
      dimensions,
      transform,
    );
    expect(strokes).toHaveLength(20);
    expect(strokes[0]?.fillStyle).toBe("#ffffff");
  });

  it("paints the reduced layouts too", () => {
    const { ctx, fills } = createMockContext();
    paintPositionalHeatmapLayer(ctx, layer({ layout: "horizontal" }), dimensions, transform);
    expect(fills).toHaveLength(5);
  });
});
