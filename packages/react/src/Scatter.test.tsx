import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pitch } from "./Pitch.js";
import { Scatter } from "./Scatter.js";

describe("Scatter", () => {
  it("renders one circle per datum", () => {
    const data = [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
    ];
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter data={data} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    expect(container.querySelectorAll('[data-pitchkit-mark="scatter"]')).toHaveLength(3);
  });

  it("positions marks via the same transform math as core (statsbomb, no letterboxing)", () => {
    // statsbomb 120x80 into a 600x400 viewport -> scale 5, no offset
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter data={[{ x: 60, y: 40 }]} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const circle = container.querySelector('[data-pitchkit-mark="scatter"]');
    expect(circle?.getAttribute("cx")).toBe("300");
    expect(circle?.getAttribute("cy")).toBe("200");
  });

  it("applies the accessor-resolved radius, fill, and stroke", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter
          data={[{ x: 10, y: 10 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          r={7}
          fill="red"
          stroke="blue"
        />
      </Pitch>,
    );

    const circle = container.querySelector('[data-pitchkit-mark="scatter"]');
    expect(circle?.getAttribute("r")).toBe("7");
    expect((circle as SVGElement).style.fill).toBe("red");
    expect((circle as SVGElement).style.stroke).toBe("blue");
  });

  it("calls the tooltip accessor on hover and clears it on leave", () => {
    const tooltip = vi.fn((d: { x: number; y: number }) => `Point at ${d.x},${d.y}`);
    const { container, getByRole, queryByRole } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter data={[{ x: 60, y: 40 }]} x={(d) => d.x} y={(d) => d.y} tooltip={tooltip} />
      </Pitch>,
    );

    expect(queryByRole("tooltip")).toBeNull();

    const circle = container.querySelector('[data-pitchkit-mark="scatter"]');
    if (!circle) throw new Error("scatter mark not found");
    fireEvent.mouseEnter(circle);

    expect(tooltip).toHaveBeenCalledWith({ x: 60, y: 40 }, 0);
    expect(getByRole("tooltip").textContent).toBe("Point at 60,40");

    fireEvent.mouseLeave(circle);
    expect(queryByRole("tooltip")).toBeNull();
  });
});
