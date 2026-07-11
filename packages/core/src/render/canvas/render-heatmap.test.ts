import { afterEach, describe, expect, it, vi } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { HeatmapLayer, Layer, ScatterLayer, Scene } from "../../scene/types.js";
import { canvasRenderer, renderHeatmapLayersToCanvas } from "./render-heatmap.js";

interface FillRectCall {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * happy-dom's canvas.getContext("2d") returns null (no real 2D rendering
 * support), so `HTMLCanvasElement.prototype.getContext` is stubbed to hand
 * back a recording fake — the same technique paint-heatmap.test.ts uses,
 * just wired through the real canvas.getContext() call path instead of
 * being passed directly, since renderHeatmapLayersToCanvas owns that call.
 */
function stubCanvasContext(): { calls: FillRectCall[]; setTransformCalls: number[][] } {
  const calls: FillRectCall[] = [];
  const setTransformCalls: number[][] = [];
  const ctx = {
    fillStyle: "",
    fillRect(x: number, y: number, width: number, height: number) {
      calls.push({ x, y, width, height });
    },
    clearRect() {},
    setTransform(...args: number[]) {
      setTransformCalls.push(args);
    },
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  return { calls, setTransformCalls };
}

const dimensions = PITCH_DIMENSIONS.statsbomb;

function heatmapLayer(overrides: Partial<HeatmapLayer<{ x: number; y: number }>> = {}): Layer {
  return {
    type: "heatmap",
    data: [],
    x: (d: { x: number }) => d.x,
    y: (d: { y: number }) => d.y,
    binsX: 2,
    binsY: 2,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("renderHeatmapLayersToCanvas", () => {
  it("sizes the canvas to viewport * devicePixelRatio in physical pixels, viewport size in CSS pixels", () => {
    const canvas = document.createElement("canvas");
    const scene: Scene = {
      dimensions,
      viewport: { width: 300, height: 200, orientation: "horizontal" },
      layers: [],
    };

    renderHeatmapLayersToCanvas(scene, canvas, { devicePixelRatio: 2 });

    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(400);
    expect(canvas.style.width).toBe("300px");
    expect(canvas.style.height).toBe("200px");
  });

  it("defaults devicePixelRatio to 1 when unset and window.devicePixelRatio is unavailable-like", () => {
    const canvas = document.createElement("canvas");
    const scene: Scene = {
      dimensions,
      viewport: { width: 300, height: 200, orientation: "horizontal" },
      layers: [],
    };

    renderHeatmapLayersToCanvas(scene, canvas); // no explicit dpr; happy-dom's window.devicePixelRatio is 1

    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(200);
  });

  it("does not throw when no 2D context is available (e.g. happy-dom's real getContext)", () => {
    const canvas = document.createElement("canvas");
    const scene: Scene = {
      dimensions,
      viewport: { width: 300, height: 200, orientation: "horizontal" },
      layers: [heatmapLayer()],
    };

    expect(() => renderHeatmapLayersToCanvas(scene, canvas)).not.toThrow();
  });

  it("resets the transform via setTransform rather than compounding scale on repeated renders", () => {
    const { setTransformCalls } = stubCanvasContext();
    const canvas = document.createElement("canvas");
    const scene: Scene = {
      dimensions,
      viewport: { width: 300, height: 200, orientation: "horizontal" },
      layers: [],
    };

    renderHeatmapLayersToCanvas(scene, canvas, { devicePixelRatio: 2 });
    renderHeatmapLayersToCanvas(scene, canvas, { devicePixelRatio: 2 });

    expect(setTransformCalls).toEqual([
      [2, 0, 0, 2, 0, 0],
      [2, 0, 0, 2, 0, 0],
    ]);
  });

  it("paints only heatmap-type layers, ignoring other layer types in the same scene", () => {
    const { calls } = stubCanvasContext();
    const canvas = document.createElement("canvas");
    const scatterLayer: ScatterLayer<{ x: number; y: number }> = {
      type: "scatter",
      data: [{ x: 1, y: 1 }],
      x: (d) => d.x,
      y: (d) => d.y,
    };
    const scene: Scene = {
      dimensions,
      viewport: { width: 600, height: 400, orientation: "horizontal" },
      layers: [scatterLayer, heatmapLayer()],
    };

    renderHeatmapLayersToCanvas(scene, canvas);

    // 2x2 bins from the one heatmap layer, nothing extra from the scatter layer
    expect(calls).toHaveLength(4);
  });

  it("paints every heatmap layer when a scene has more than one", () => {
    const { calls } = stubCanvasContext();
    const canvas = document.createElement("canvas");
    const scene: Scene = {
      dimensions,
      viewport: { width: 600, height: 400, orientation: "horizontal" },
      layers: [heatmapLayer({ binsX: 2, binsY: 2 }), heatmapLayer({ binsX: 3, binsY: 1 })],
    };

    renderHeatmapLayersToCanvas(scene, canvas);

    expect(calls).toHaveLength(4 + 3);
  });
});

describe("canvasRenderer", () => {
  it("implements Renderer<HTMLCanvasElement>, returning a canvas sized to the scene's viewport", () => {
    const scene: Scene = {
      dimensions,
      viewport: { width: 250, height: 150, orientation: "horizontal" },
      layers: [],
    };

    const canvas = canvasRenderer.render(scene);

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.style.width).toBe("250px");
    expect(canvas.style.height).toBe("150px");
  });
});
