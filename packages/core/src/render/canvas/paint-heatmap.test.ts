import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { HeatmapLayer } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import type { Viewport } from "../../transform/types.js";
import { paintHeatmapLayer } from "./paint-heatmap.js";

interface FillRectCall {
  fillStyle: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * happy-dom's <canvas> doesn't implement real 2D rendering, so painting is
 * tested against a hand-rolled mock recording fillRect calls (and the
 * fillStyle active at the time), rather than real pixel output.
 */
function createMockContext(): { ctx: CanvasRenderingContext2D; calls: FillRectCall[] } {
  const calls: FillRectCall[] = [];
  const ctx = {
    fillStyle: "",
    fillRect(x: number, y: number, width: number, height: number) {
      calls.push({ fillStyle: ctx.fillStyle, x, y, width, height });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const dimensions = PITCH_DIMENSIONS.statsbomb; // 120 x 80
const viewport: Viewport = { width: 600, height: 400, orientation: "horizontal" };
const transform = createPixelTransform(dimensions, viewport); // scale = 5, no offset

describe("paintHeatmapLayer", () => {
  it("issues exactly one fillRect per bin", () => {
    const { ctx, calls } = createMockContext();
    const layer: HeatmapLayer<{ x: number; y: number }> = {
      type: "heatmap",
      data: [{ x: 10, y: 10 }],
      x: (d) => d.x,
      y: (d) => d.y,
      binsX: 3,
      binsY: 2,
    };

    paintHeatmapLayer(ctx, layer, dimensions, transform);

    expect(calls).toHaveLength(6);
  });

  it("positions each bin's rect via the same PixelTransform used by every other shape", () => {
    const { ctx, calls } = createMockContext();
    const layer: HeatmapLayer<{ x: number; y: number }> = {
      type: "heatmap",
      data: [],
      x: (d) => d.x,
      y: (d) => d.y,
      binsX: 4,
      binsY: 2,
    };

    paintHeatmapLayer(ctx, layer, dimensions, transform);

    // bin (0,0): provider [0,0]-[30,40] -> pixel [0,0]-[150,200] at scale 5
    const originCall = calls.find((c) => c.x === 0 && c.y === 0);
    expect(originCall).toBeDefined();
    expect(originCall?.width).toBeCloseTo(150, 6);
    expect(originCall?.height).toBeCloseTo(200, 6);
  });

  it("colors the highest-value bin with colorMax and empty bins with colorMin", () => {
    const { ctx, calls } = createMockContext();
    const layer: HeatmapLayer<{ x: number; y: number }> = {
      type: "heatmap",
      data: [
        { x: 5, y: 5 }, // bin (0,0), value 3
        { x: 5, y: 5 },
        { x: 5, y: 5 },
        { x: 115, y: 75 }, // bin (3,1), value 1
      ],
      x: (d) => d.x,
      y: (d) => d.y,
      binsX: 4,
      binsY: 2,
      colorMin: "#000000",
      colorMax: "#ffffff",
    };

    paintHeatmapLayer(ctx, layer, dimensions, transform);

    const emptyBinCall = calls.find((c) => c.x === 300 && c.y === 0); // bin (2,0), value 0
    const maxValueCall = calls.find((c) => c.x === 0 && c.y === 0); // bin (0,0), value 3 (max)

    expect(emptyBinCall?.fillStyle).toBe("rgb(0, 0, 0)");
    expect(maxValueCall?.fillStyle).toBe("rgb(255, 255, 255)");
  });

  it("paints every bin with colorMin when all bin values are equal (e.g. empty data)", () => {
    const { ctx, calls } = createMockContext();
    const layer: HeatmapLayer<{ x: number; y: number }> = {
      type: "heatmap",
      data: [],
      x: (d) => d.x,
      y: (d) => d.y,
      binsX: 2,
      binsY: 2,
      colorMin: "#123456",
    };

    paintHeatmapLayer(ctx, layer, dimensions, transform);

    expect(calls.every((c) => c.fillStyle === "rgb(18, 52, 86)")).toBe(true);
  });

  it("falls back to the default blue-to-red color scale when colorMin/colorMax are unset", () => {
    const { ctx, calls } = createMockContext();
    const layer: HeatmapLayer<{ x: number; y: number }> = {
      type: "heatmap",
      data: [],
      x: (d) => d.x,
      y: (d) => d.y,
      binsX: 2,
      binsY: 2,
    };

    paintHeatmapLayer(ctx, layer, dimensions, transform);

    expect(calls.every((c) => c.fillStyle === "rgb(29, 78, 216)")).toBe(true); // #1d4ed8
  });
});
