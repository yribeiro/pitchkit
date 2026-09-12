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

  it("applies the className prop to the circle element", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter data={[{ x: 10, y: 10 }]} x={(d) => d.x} y={(d) => d.y} className="my-mark" />
      </Pitch>,
    );

    expect(container.querySelector('[data-pitchkit-mark="scatter"]')?.getAttribute("class")).toBe(
      "my-mark",
    );
  });

  it("omits the themed default fill/stroke inline style when className is set without fill/stroke, so a Tailwind class can take effect", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter data={[{ x: 10, y: 10 }]} x={(d) => d.x} y={(d) => d.y} className="fill-red-500" />
      </Pitch>,
    );

    const circle = container.querySelector('[data-pitchkit-mark="scatter"]') as SVGElement;
    expect(circle.style.fill).toBe("");
    expect(circle.style.stroke).toBe("");
  });

  it("still applies an explicit fill/stroke prop even when className is set", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter
          data={[{ x: 10, y: 10 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          fill="red"
          className="my-mark"
        />
      </Pitch>,
    );

    const circle = container.querySelector('[data-pitchkit-mark="scatter"]') as SVGElement;
    expect(circle.style.fill).toBe("red");
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

  it("renders no tooltip when the accessor returns nothing for that datum", () => {
    // A per-datum accessor that only labels some marks is a normal shape —
    // the ones it skips must show nothing, not an empty tooltip box.
    const { container, queryByRole } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter
          data={[{ x: 60, y: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          tooltip={() => undefined}
        />
      </Pitch>,
    );

    const circle = container.querySelector('[data-pitchkit-mark="scatter"]');
    if (!circle) throw new Error("scatter mark not found");
    fireEvent.mouseEnter(circle);

    expect(queryByRole("tooltip")).toBeNull();
  });
});
