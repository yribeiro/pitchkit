import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Voronoi } from "./Voronoi.js";
import { Pitch } from "./Pitch.js";

const players = [
  { x: 30, y: 20 },
  { x: 90, y: 20 },
  { x: 60, y: 60 },
];

describe("Voronoi", () => {
  it("renders one cell per datum", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Voronoi data={players} x={(p) => p.x} y={(p) => p.y} />
      </Pitch>,
    );

    expect(container.querySelectorAll('[data-pitchkit-mark="voronoi"]')).toHaveLength(3);
  });

  it("each cell has at least 3 vertices", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Voronoi data={players} x={(p) => p.x} y={(p) => p.y} />
      </Pitch>,
    );

    container.querySelectorAll('[data-pitchkit-mark="voronoi"]').forEach((cell) => {
      const points = cell.getAttribute("points")?.trim().split(/\s+/) ?? [];
      expect(points.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("applies per-datum fill via accessor", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Voronoi
          data={players}
          x={(p) => p.x}
          y={(p) => p.y}
          fill={(_p, i) => (i === 0 ? "red" : "blue")}
        />
      </Pitch>,
    );

    const cells = container.querySelectorAll('[data-pitchkit-mark="voronoi"]');
    expect((cells[0] as unknown as SVGElement).style.fill).toBe("red");
    expect((cells[1] as unknown as SVGElement).style.fill).toBe("blue");
  });

  it("calls the tooltip accessor on hover and clears it on leave", () => {
    const tooltip = vi.fn((_p: { x: number; y: number }, i: number) => `Cell ${i}`);
    const { container, getByRole, queryByRole } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Voronoi data={players} x={(p) => p.x} y={(p) => p.y} tooltip={tooltip} />
      </Pitch>,
    );

    expect(queryByRole("tooltip")).toBeNull();
    const cell = container.querySelector('[data-pitchkit-mark="voronoi"]');
    if (!cell) throw new Error("voronoi mark not found");
    fireEvent.mouseEnter(cell);
    expect(getByRole("tooltip").textContent).toBe("Cell 0");
    fireEvent.mouseLeave(cell);
    expect(queryByRole("tooltip")).toBeNull();
  });
});
