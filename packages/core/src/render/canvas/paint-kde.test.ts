import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { KdeLayer } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import type { Viewport } from "../../transform/types.js";
import { paintKdeLayer } from "./paint-kde.js";

interface FillRectCall {
  fillStyle: string;
  globalAlpha: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Records the alpha as well as the fill, since the alpha ramp is what makes a KDE a KDE. */
function createMockContext(): { ctx: CanvasRenderingContext2D; calls: FillRectCall[] } {
  const calls: FillRectCall[] = [];
  const ctx = {
    fillStyle: "",
    globalAlpha: 1,
    fillRect(x: number, y: number, width: number, height: number) {
      calls.push({ fillStyle: ctx.fillStyle, globalAlpha: ctx.globalAlpha, x, y, width, height });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const dimensions = PITCH_DIMENSIONS.statsbomb; // 120 x 80
const viewport: Viewport = { width: 600, height: 400, orientation: "horizontal" };
const transform = createPixelTransform(dimensions, viewport); // scale = 5, no offset

function layer(overrides: Partial<KdeLayer<{ x: number; y: number }>> = {}): KdeLayer<{
  x: number;
  y: number;
}> {
  return {
    type: "kde",
    data: [],
    x: (d) => d.x,
    y: (d) => d.y,
    ...overrides,
  };
}

describe("paintKdeLayer", () => {
  it("paints nothing for empty data", () => {
    const { ctx, calls } = createMockContext();
    paintKdeLayer(ctx, layer({ resolution: 16 }), dimensions, transform);
    expect(calls).toHaveLength(0);
  });

  it("skips zero-density cells rather than painting the whole grid", () => {
    const { ctx, calls } = createMockContext();
    paintKdeLayer(
      ctx,
      layer({ data: [{ x: 60, y: 40 }], resolution: 32, bandwidth: 3 }),
      dimensions,
      transform,
    );
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.length).toBeLessThan(32 * 32);
  });

  it("ramps opacity with density, peaking at maxOpacity", () => {
    const { ctx, calls } = createMockContext();
    paintKdeLayer(
      ctx,
      layer({ data: [{ x: 60, y: 40 }], resolution: 32, bandwidth: 10, maxOpacity: 0.5 }),
      dimensions,
      transform,
    );
    const alphas = calls.map((c) => c.globalAlpha);
    expect(Math.max(...alphas)).toBeCloseTo(0.5, 6);
    expect(Math.min(...alphas)).toBeLessThan(0.5);
    expect(Math.min(...alphas)).toBeGreaterThan(0);
  });

  it("restores the context's previous globalAlpha when it's done", () => {
    const { ctx } = createMockContext();
    ctx.globalAlpha = 0.25;
    paintKdeLayer(
      ctx,
      layer({ data: [{ x: 60, y: 40 }], resolution: 16, bandwidth: 10 }),
      dimensions,
      transform,
    );
    expect(ctx.globalAlpha).toBe(0.25);
  });

  it("colors the peak with colorMax", () => {
    const { ctx, calls } = createMockContext();
    paintKdeLayer(
      ctx,
      layer({
        data: [{ x: 60, y: 40 }],
        resolution: 32,
        bandwidth: 10,
        colorMin: "#000000",
        colorMax: "#ffffff",
      }),
      dimensions,
      transform,
    );
    expect(calls.some((c) => c.fillStyle === "rgb(255, 255, 255)")).toBe(true);
  });

  it("snaps cells to whole pixels so neighbours share an exact edge", () => {
    const { ctx, calls } = createMockContext();
    paintKdeLayer(
      ctx,
      layer({ data: [{ x: 60, y: 40 }], resolution: 16, bandwidth: 20 }),
      dimensions,
      transform,
    );

    for (const call of calls) {
      expect(Number.isInteger(call.x)).toBe(true);
      expect(Number.isInteger(call.y)).toBe(true);
      expect(Number.isInteger(call.width)).toBe(true);
    }

    // 16 cells across 600px = 37.5px each, so snapping alternates 37/38
    // with no gap or overlap: every cell's right edge is the next one's left.
    const row = calls.filter((c) => c.y === calls[0]?.y).sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i += 1) {
      const previous = row[i - 1] as FillRectCall;
      expect(row[i]?.x).toBe(previous.x + previous.width);
    }
  });
});
