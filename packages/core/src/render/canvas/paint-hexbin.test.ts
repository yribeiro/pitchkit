import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { PitchType } from "../../dimensions/types.js";
import { fromExtentFrame } from "../../transform/canonical.js";
import type { HexbinLayer } from "../../scene/types.js";
import { createPixelTransform } from "../../transform/pixel-transform.js";
import type { Viewport } from "../../transform/types.js";
import { paintHexbinLayer } from "./paint-hexbin.js";

type Op =
  | { op: "beginPath" }
  | { op: "moveTo"; x: number; y: number }
  | { op: "lineTo"; x: number; y: number }
  | { op: "closePath" }
  | { op: "fill"; fillStyle: string }
  | { op: "stroke"; strokeStyle: string; lineWidth: number }
  | { op: "rect"; x: number; y: number; width: number; height: number }
  | { op: "clip" }
  | { op: "save" }
  | { op: "restore" };

/**
 * Hexagons are paths, not fillRects, so the mock records the whole path
 * call sequence rather than one call shape (see paint-heatmap.test.ts for
 * why happy-dom's canvas can't be used directly).
 */
function createMockContext(): { ctx: CanvasRenderingContext2D; ops: Op[] } {
  const ops: Op[] = [];
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    beginPath: () => ops.push({ op: "beginPath" }),
    moveTo: (x: number, y: number) => ops.push({ op: "moveTo", x, y }),
    lineTo: (x: number, y: number) => ops.push({ op: "lineTo", x, y }),
    closePath: () => ops.push({ op: "closePath" }),
    fill: () => ops.push({ op: "fill", fillStyle: ctx.fillStyle }),
    stroke: () =>
      ops.push({ op: "stroke", strokeStyle: ctx.strokeStyle, lineWidth: ctx.lineWidth }),
    rect: (x: number, y: number, width: number, height: number) =>
      ops.push({ op: "rect", x, y, width, height }),
    clip: () => ops.push({ op: "clip" }),
    save: () => ops.push({ op: "save" }),
    restore: () => ops.push({ op: "restore" }),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, ops };
}

const dimensions = PITCH_DIMENSIONS.statsbomb; // 120 x 80
const viewport: Viewport = { width: 600, height: 400, orientation: "horizontal" };
const transform = createPixelTransform(dimensions, viewport); // scale = 5, no offset

function layer(overrides: Partial<HexbinLayer<{ x: number; y: number }>> = {}): HexbinLayer<{
  x: number;
  y: number;
}> {
  return {
    type: "hexbin",
    data: [],
    x: (d) => d.x,
    y: (d) => d.y,
    ...overrides,
  };
}

describe("paintHexbinLayer", () => {
  it("draws nothing at all for empty data", () => {
    const { ctx, ops } = createMockContext();
    paintHexbinLayer(ctx, layer(), dimensions, transform);
    expect(ops).toHaveLength(0);
  });

  it("draws one six-sided closed path per occupied bin", () => {
    const { ctx, ops } = createMockContext();
    paintHexbinLayer(
      ctx,
      layer({
        data: [
          { x: 30, y: 20 },
          { x: 90, y: 60 },
        ],
        binsX: 10,
      }),
      dimensions,
      transform,
    );
    expect(ops.filter((o) => o.op === "fill")).toHaveLength(2);
    expect(ops.filter((o) => o.op === "moveTo")).toHaveLength(2);
    expect(ops.filter((o) => o.op === "lineTo")).toHaveLength(10); // 5 per hexagon
    expect(ops.filter((o) => o.op === "closePath")).toHaveLength(2);
  });

  it("clips to the pitch rectangle so edge hexagons don't bleed past the outline", () => {
    const { ctx, ops } = createMockContext();
    paintHexbinLayer(ctx, layer({ data: [{ x: 0, y: 0 }], binsX: 10 }), dimensions, transform);
    expect(ops[0]).toEqual({ op: "save" });
    expect(ops).toContainEqual({ op: "rect", x: 0, y: 0, width: 600, height: 400 });
    expect(ops).toContainEqual({ op: "clip" });
    expect(ops.at(-1)).toEqual({ op: "restore" });
  });

  it("colors the densest bin with colorMax and the sparsest with colorMin", () => {
    const { ctx, ops } = createMockContext();
    paintHexbinLayer(
      ctx,
      layer({
        data: [
          { x: 30, y: 20 },
          { x: 90, y: 60 },
          { x: 90.1, y: 60.1 },
        ],
        binsX: 10,
        colorMin: "#000000",
        colorMax: "#ffffff",
      }),
      dimensions,
      transform,
    );
    const fills = ops.filter((o) => o.op === "fill").map((o) => o.fillStyle);
    expect(fills).toContain("rgb(0, 0, 0)");
    expect(fills).toContain("rgb(255, 255, 255)");
  });

  it("outlines hexagons only when a stroke is given", () => {
    const { ctx, ops } = createMockContext();
    paintHexbinLayer(ctx, layer({ data: [{ x: 30, y: 20 }] }), dimensions, transform);
    expect(ops.filter((o) => o.op === "stroke")).toHaveLength(0);

    const withStroke = createMockContext();
    paintHexbinLayer(
      withStroke.ctx,
      layer({ data: [{ x: 30, y: 20 }], stroke: "#111111", strokeWidth: 0.5 }),
      dimensions,
      transform,
    );
    expect(withStroke.ops).toContainEqual({ op: "stroke", strokeStyle: "#111111", lineWidth: 0.5 });
  });

  it("transforms hexagon corners into pixel space", () => {
    const { ctx, ops } = createMockContext();
    paintHexbinLayer(ctx, layer({ data: [{ x: 60, y: 40 }], binsX: 10 }), dimensions, transform);
    const moveTo = ops.find((o) => o.op === "moveTo");
    // The pitch is 600x400 pixels, so every corner must land inside it.
    expect(moveTo?.x).toBeGreaterThan(0);
    expect(moveTo?.x).toBeLessThan(600);
    expect(moveTo?.y).toBeGreaterThan(0);
    expect(moveTo?.y).toBeLessThan(400);
  });
});

// Every pitch type, centre-origin SkillCorner included (D6, #90): the layer
// is clipped to the whole pitch, wherever the provider puts its origin.
describe.each(Object.keys(PITCH_DIMENSIONS) as PitchType[])("paintHexbinLayer on %s", (type) => {
  it("clips to the whole pitch", () => {
    const dims = PITCH_DIMENSIONS[type];
    const pixels = createPixelTransform(dims, viewport);
    const [x, y] = fromExtentFrame(dims, [dims.length / 2, dims.width / 2]);
    const { ctx, ops } = createMockContext();

    paintHexbinLayer(ctx, layer({ data: [{ x, y }] }), dims, pixels);

    const a = pixels.toPixel(fromExtentFrame(dims, [0, 0]));
    const b = pixels.toPixel(fromExtentFrame(dims, [dims.length, dims.width]));
    const clip = ops.find((o) => o.op === "rect") as Extract<Op, { op: "rect" }>;
    expect(clip.x).toBeCloseTo(Math.min(a[0], b[0]), 6);
    expect(clip.y).toBeCloseTo(Math.min(a[1], b[1]), 6);
    expect(clip.width).toBeCloseTo(Math.abs(b[0] - a[0]), 6);
    expect(clip.height).toBeCloseTo(Math.abs(b[1] - a[1]), 6);
  });
});
