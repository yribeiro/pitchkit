import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pitch } from "./Pitch.js";
import { PositionalHeatmap } from "./PositionalHeatmap.js";

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
    strokeStyle: "",
    lineWidth: 0,
    fillRect(x: number, y: number, width: number, height: number) {
      calls.push({ x, y, width, height });
    },
    strokeRect() {},
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

describe("PositionalHeatmap", () => {
  it("renders a labelled canvas inside a foreignObject covering the viewport", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <PositionalHeatmap data={NO_DATA} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const foreignObject = container.querySelector("foreignObject");
    expect(foreignObject?.getAttribute("width")).toBe("600");
    expect(foreignObject?.getAttribute("height")).toBe("400");
    expect(
      foreignObject?.querySelector('canvas[data-pitchkit-layer="positional-heatmap"]'),
    ).not.toBeNull();
  });

  it("paints the 20 Juego de Posición zones, not a uniform grid", () => {
    const calls = stubCanvasContext();
    render(
      <Pitch type="statsbomb" width={600} height={400}>
        <PositionalHeatmap data={[{ x: 10, y: 10 }]} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    expect(calls).toHaveLength(20);
    // Zones have different sizes — that's the whole point versus <Heatmap>.
    expect(new Set(calls.map((c) => c.width)).size).toBeGreaterThan(1);
  });

  it("paints the reduced layouts when asked", () => {
    const calls = stubCanvasContext();
    render(
      <Pitch type="statsbomb" width={600} height={400}>
        <PositionalHeatmap
          data={[{ x: 10, y: 10 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          layout="vertical"
        />
      </Pitch>,
    );

    expect(calls).toHaveLength(6);
  });

  it("does not throw when no 2D context is available (real happy-dom canvas)", () => {
    expect(() =>
      render(
        <Pitch type="statsbomb" width={600} height={400}>
          <PositionalHeatmap data={[{ x: 10, y: 10 }]} x={(d) => d.x} y={(d) => d.y} />
        </Pitch>,
      ),
    ).not.toThrow();
  });
});
