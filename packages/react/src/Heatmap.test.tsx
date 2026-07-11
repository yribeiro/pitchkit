import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Heatmap } from "./Heatmap.js";
import { Pitch } from "./Pitch.js";

interface FillRectCall {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Datum {
  x: number;
  y: number;
}

const NO_DATA: Datum[] = [];

/** Same technique core's own canvas tests use — happy-dom's canvas has no real 2D support. */
function stubCanvasContext(): FillRectCall[] {
  const calls: FillRectCall[] = [];
  const ctx = {
    fillStyle: "",
    fillRect(x: number, y: number, width: number, height: number) {
      calls.push({ x, y, width, height });
    },
    clearRect() {},
    setTransform() {},
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  return calls;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Heatmap", () => {
  it("renders a canvas element inside a foreignObject", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Heatmap data={NO_DATA} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const foreignObject = container.querySelector("foreignObject");
    expect(foreignObject).not.toBeNull();
    expect(foreignObject?.querySelector("canvas")).not.toBeNull();
  });

  it("the foreignObject covers the full viewport", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Heatmap data={NO_DATA} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const foreignObject = container.querySelector("foreignObject");
    expect(foreignObject?.getAttribute("width")).toBe("600");
    expect(foreignObject?.getAttribute("height")).toBe("400");
  });

  it("paints via renderHeatmapLayersToCanvas: binsX * binsY fillRect calls", () => {
    const calls = stubCanvasContext();
    render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Heatmap data={[{ x: 10, y: 10 }]} x={(d) => d.x} y={(d) => d.y} binsX={3} binsY={2} />
      </Pitch>,
    );

    expect(calls).toHaveLength(6);
  });

  it("does not throw when no 2D context is available (real happy-dom canvas)", () => {
    expect(() =>
      render(
        <Pitch type="statsbomb" width={600} height={400}>
          <Heatmap data={[{ x: 10, y: 10 }]} x={(d) => d.x} y={(d) => d.y} />
        </Pitch>,
      ),
    ).not.toThrow();
  });
});
