import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Arrows } from "./Arrows.js";
import { Pitch } from "./Pitch.js";

describe("Arrows", () => {
  it("renders one shaft + one head per datum", () => {
    const data: { from: [number, number]; to: [number, number] }[] = [
      { from: [10, 10], to: [50, 50] },
    ];
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Arrows
          data={data}
          x={(d) => d.from[0]}
          y={(d) => d.from[1]}
          x2={(d) => d.to[0]}
          y2={(d) => d.to[1]}
        />
      </Pitch>,
    );

    expect(container.querySelectorAll('[data-pitchkit-mark="arrow-shaft"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-pitchkit-mark="arrow-head"]')).toHaveLength(1);
  });

  it("positions the shaft endpoints via the shared transform", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Arrows
          data={[{ x: 0, y: 0, x2: 60, y2: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          x2={(d) => d.x2}
          y2={(d) => d.y2}
        />
      </Pitch>,
    );

    const shaft = container.querySelector('[data-pitchkit-mark="arrow-shaft"]');
    expect(shaft?.getAttribute("x1")).toBe("0");
    expect(shaft?.getAttribute("y1")).toBe("0");
    expect(shaft?.getAttribute("x2")).toBe("300");
    expect(shaft?.getAttribute("y2")).toBe("200");
  });

  it("the arrowhead polygon has 3 points", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Arrows
          data={[{ x: 0, y: 0, x2: 60, y2: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          x2={(d) => d.x2}
          y2={(d) => d.y2}
        />
      </Pitch>,
    );

    const head = container.querySelector('[data-pitchkit-mark="arrow-head"]');
    const points = head?.getAttribute("points")?.trim().split(/\s+/);
    expect(points).toHaveLength(3);
  });

  it("applies the className prop to both the shaft and the head", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Arrows
          data={[{ x: 0, y: 0, x2: 60, y2: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          x2={(d) => d.x2}
          y2={(d) => d.y2}
          className="my-arrow"
        />
      </Pitch>,
    );

    expect(
      container.querySelector('[data-pitchkit-mark="arrow-shaft"]')?.getAttribute("class"),
    ).toBe("my-arrow");
    expect(container.querySelector('[data-pitchkit-mark="arrow-head"]')?.getAttribute("class")).toBe(
      "my-arrow",
    );
  });

  it("omits the themed default stroke inline style when className is set without stroke", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Arrows
          data={[{ x: 0, y: 0, x2: 60, y2: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          x2={(d) => d.x2}
          y2={(d) => d.y2}
          className="stroke-red-500"
        />
      </Pitch>,
    );

    const shaft = container.querySelector('[data-pitchkit-mark="arrow-shaft"]') as SVGElement;
    const head = container.querySelector('[data-pitchkit-mark="arrow-head"]') as SVGElement;
    expect(shaft.style.stroke).toBe("");
    expect(head.style.fill).toBe("");
  });

  it("shows a tooltip on hover over the arrow group", () => {
    const tooltip = vi.fn(() => "pass");
    const { container, getByRole } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Arrows
          data={[{ x: 0, y: 0, x2: 60, y2: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          x2={(d) => d.x2}
          y2={(d) => d.y2}
          tooltip={tooltip}
        />
      </Pitch>,
    );

    const group = container.querySelector('[data-pitchkit-layer="arrows"] > g');
    if (!group) throw new Error("arrow group not found");
    fireEvent.mouseEnter(group);
    expect(getByRole("tooltip").textContent).toBe("pass");
  });
});
