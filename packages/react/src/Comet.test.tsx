import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Comet } from "./Comet.js";
import { Pitch } from "./Pitch.js";

describe("Comet", () => {
  it("renders one polygon per datum", () => {
    const data = [
      { x: 0, y: 0, x2: 30, y2: 20 },
      { x: 30, y: 20, x2: 60, y2: 40 },
    ];
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Comet data={data} x={(d) => d.x} y={(d) => d.y} x2={(d) => d.x2} y2={(d) => d.y2} />
      </Pitch>,
    );

    expect(container.querySelectorAll('[data-pitchkit-mark="comet"]')).toHaveLength(2);
  });

  it("the polygon has 4 points (tapered quad)", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Comet
          data={[{ x: 0, y: 0, x2: 60, y2: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          x2={(d) => d.x2}
          y2={(d) => d.y2}
        />
      </Pitch>,
    );

    const polygon = container.querySelector('[data-pitchkit-mark="comet"]');
    const points = polygon?.getAttribute("points")?.trim().split(/\s+/);
    expect(points).toHaveLength(4);
  });

  it("uses a flat fill color when gradient is unset", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Comet
          data={[{ x: 0, y: 0, x2: 60, y2: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          x2={(d) => d.x2}
          y2={(d) => d.y2}
          color="red"
        />
      </Pitch>,
    );

    const polygon = container.querySelector('[data-pitchkit-mark="comet"]');
    expect((polygon as unknown as SVGElement).style.fill).toBe("red");
    expect(container.querySelector("linearGradient")).toBeNull();
  });

  it("renders a unique linearGradient per datum when gradient is set", () => {
    const data = [
      { x: 0, y: 0, x2: 30, y2: 20 },
      { x: 30, y: 20, x2: 60, y2: 40 },
    ];
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Comet
          data={data}
          x={(d) => d.x}
          y={(d) => d.y}
          x2={(d) => d.x2}
          y2={(d) => d.y2}
          gradient
        />
      </Pitch>,
    );

    const gradients = container.querySelectorAll("linearGradient");
    expect(gradients).toHaveLength(2);
    const ids = Array.from(gradients).map((g) => g.getAttribute("id"));
    expect(new Set(ids).size).toBe(2); // both unique

    const polygons = container.querySelectorAll('[data-pitchkit-mark="comet"]');
    polygons.forEach((polygon, i) => {
      expect((polygon as unknown as SVGElement).style.fill).toBe(`url(#${ids[i]})`);
    });
  });
});
