import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Hexbin } from "./Hexbin.js";
import { Pitch } from "./Pitch.js";

interface Datum {
  x: number;
  y: number;
}

const NO_DATA: Datum[] = [];

/** Hexagons are paths, so the stub records the path op sequence rather than fillRects. */
function stubCanvasContext(): string[] {
  const ops: string[] = [];
  const record = (name: string) => () => {
    ops.push(name);
  };
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    clearRect() {},
    setTransform() {},
    save: record("save"),
    restore: record("restore"),
    beginPath: record("beginPath"),
    rect: record("rect"),
    clip: record("clip"),
    moveTo: record("moveTo"),
    lineTo: record("lineTo"),
    closePath: record("closePath"),
    fill: record("fill"),
    stroke: record("stroke"),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  return ops;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Hexbin", () => {
  it("renders a labelled canvas inside a foreignObject covering the viewport", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Hexbin data={NO_DATA} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const foreignObject = container.querySelector("foreignObject");
    expect(foreignObject?.getAttribute("width")).toBe("600");
    expect(foreignObject?.querySelector('canvas[data-pitchkit-layer="hexbin"]')).not.toBeNull();
  });

  it("paints one hexagon path per occupied bin", () => {
    const ops = stubCanvasContext();
    render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Hexbin
          data={[
            { x: 30, y: 20 },
            { x: 90, y: 60 },
          ]}
          x={(d) => d.x}
          y={(d) => d.y}
          binsX={10}
        />
      </Pitch>,
    );

    expect(ops.filter((op) => op === "fill")).toHaveLength(2);
    expect(ops.filter((op) => op === "lineTo")).toHaveLength(10); // 5 per hexagon
  });

  it("paints nothing at all when there is no data", () => {
    const ops = stubCanvasContext();
    render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Hexbin data={NO_DATA} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    expect(ops.filter((op) => op === "fill")).toHaveLength(0);
  });

  it("does not throw when no 2D context is available (real happy-dom canvas)", () => {
    expect(() =>
      render(
        <Pitch type="statsbomb" width={600} height={400}>
          <Hexbin data={[{ x: 10, y: 10 }]} x={(d) => d.x} y={(d) => d.y} />
        </Pitch>,
      ),
    ).not.toThrow();
  });
});
