import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Polygon } from "./Polygon.js";
import { Pitch } from "./Pitch.js";

describe("Polygon", () => {
  it("renders one polygon per datum", () => {
    const data = [
      {
        vertices: [
          [10, 10],
          [30, 10],
          [30, 30],
        ] as const,
      },
      {
        vertices: [
          [50, 50],
          [70, 50],
          [70, 70],
        ] as const,
      },
    ];
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Polygon data={data} points={(d) => d.vertices} />
      </Pitch>,
    );

    expect(container.querySelectorAll('[data-pitchkit-mark="polygon"]')).toHaveLength(2);
  });

  it("renders the resolved vertex count as SVG points", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Polygon
          data={[{ vertices: [[0, 0], [10, 0], [10, 10], [0, 10]] as const }]}
          points={(d) => d.vertices}
        />
      </Pitch>,
    );

    const polygon = container.querySelector('[data-pitchkit-mark="polygon"]');
    const points = polygon?.getAttribute("points")?.trim().split(/\s+/);
    expect(points).toHaveLength(4);
  });

  it("applies the className prop", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Polygon
          data={[{ vertices: [[0, 0], [10, 0], [10, 10]] as const }]}
          points={(d) => d.vertices}
          className="my-zone"
        />
      </Pitch>,
    );

    expect(
      container.querySelector('[data-pitchkit-mark="polygon"]')?.getAttribute("class"),
    ).toBe("my-zone");
  });

  it("omits the themed default fill when className is set without fill", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Polygon
          data={[{ vertices: [[0, 0], [10, 0], [10, 10]] as const }]}
          points={(d) => d.vertices}
          className="fill-red-500"
        />
      </Pitch>,
    );

    const polygon = container.querySelector('[data-pitchkit-mark="polygon"]') as SVGElement;
    expect(polygon.style.fill).toBe("");
  });

  it("calls the tooltip accessor on hover and clears it on leave", () => {
    const tooltip = vi.fn(() => "Zone A");
    const { container, getByRole, queryByRole } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Polygon
          data={[{ vertices: [[0, 0], [10, 0], [10, 10]] as const }]}
          points={(d) => d.vertices}
          tooltip={tooltip}
        />
      </Pitch>,
    );

    expect(queryByRole("tooltip")).toBeNull();
    const polygon = container.querySelector('[data-pitchkit-mark="polygon"]');
    if (!polygon) throw new Error("polygon mark not found");
    fireEvent.mouseEnter(polygon);
    expect(getByRole("tooltip").textContent).toBe("Zone A");
    fireEvent.mouseLeave(polygon);
    expect(queryByRole("tooltip")).toBeNull();
  });
});
