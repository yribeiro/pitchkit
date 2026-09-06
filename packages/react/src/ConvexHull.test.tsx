import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConvexHull } from "./ConvexHull.js";
import { Pitch } from "./Pitch.js";

const players = [
  { x: 20, y: 20 },
  { x: 100, y: 20 },
  { x: 100, y: 60 },
  { x: 20, y: 60 },
  { x: 60, y: 40 }, // interior
];

describe("ConvexHull", () => {
  it("renders exactly one polygon for the whole dataset", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <ConvexHull data={players} x={(p) => p.x} y={(p) => p.y} />
      </Pitch>,
    );

    expect(container.querySelectorAll('[data-pitchkit-mark="convex-hull"]')).toHaveLength(1);
  });

  it("excludes interior points from the rendered hull", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <ConvexHull data={players} x={(p) => p.x} y={(p) => p.y} />
      </Pitch>,
    );

    const polygon = container.querySelector('[data-pitchkit-mark="convex-hull"]');
    const points = polygon?.getAttribute("points")?.trim().split(/\s+/) ?? [];
    expect(points).toHaveLength(4);
  });

  it("applies the className prop", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <ConvexHull data={players} x={(p) => p.x} y={(p) => p.y} className="touch-map" />
      </Pitch>,
    );

    expect(
      container.querySelector('[data-pitchkit-mark="convex-hull"]')?.getAttribute("class"),
    ).toBe("touch-map");
  });

  it("shows and clears the static tooltip on hover", () => {
    const { container, getByRole, queryByRole } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <ConvexHull data={players} x={(p) => p.x} y={(p) => p.y} tooltip="Touch map" />
      </Pitch>,
    );

    expect(queryByRole("tooltip")).toBeNull();
    const polygon = container.querySelector('[data-pitchkit-mark="convex-hull"]');
    if (!polygon) throw new Error("convex-hull mark not found");
    fireEvent.mouseEnter(polygon);
    expect(getByRole("tooltip").textContent).toBe("Touch map");
    fireEvent.mouseLeave(polygon);
    expect(queryByRole("tooltip")).toBeNull();
  });
});
