import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KDE } from "./KDE.js";
import { Pitch } from "./Pitch.js";

interface FillRectCall {
  globalAlpha: number;
  x: number;
  y: number;
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
    globalAlpha: 1,
    fillRect(x: number, y: number) {
      calls.push({ globalAlpha: ctx.globalAlpha, x, y });
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

describe("KDE", () => {
  it("renders a labelled canvas inside a foreignObject covering the viewport", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <KDE data={NO_DATA} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const foreignObject = container.querySelector("foreignObject");
    expect(foreignObject?.getAttribute("height")).toBe("400");
    expect(foreignObject?.querySelector('canvas[data-pitchkit-layer="kde"]')).not.toBeNull();
  });

  it("paints a density surface with a per-cell opacity ramp", () => {
    const calls = stubCanvasContext();
    render(
      <Pitch type="statsbomb" width={600} height={400}>
        <KDE
          data={[{ x: 60, y: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          resolution={32}
          bandwidth={10}
        />
      </Pitch>,
    );

    expect(calls.length).toBeGreaterThan(0);
    expect(new Set(calls.map((c) => c.globalAlpha)).size).toBeGreaterThan(1);
  });

  it("paints nothing when there is no data (no surface to draw)", () => {
    const calls = stubCanvasContext();
    render(
      <Pitch type="statsbomb" width={600} height={400}>
        <KDE data={NO_DATA} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    expect(calls).toHaveLength(0);
  });

  it("does not throw when no 2D context is available (real happy-dom canvas)", () => {
    expect(() =>
      render(
        <Pitch type="statsbomb" width={600} height={400}>
          <KDE data={[{ x: 10, y: 10 }]} x={(d) => d.x} y={(d) => d.y} />
        </Pitch>,
      ),
    ).not.toThrow();
  });
});
