import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Flow } from "./Flow.js";
import { Pitch } from "./Pitch.js";

const passes = [
  { from: { x: 10, y: 10 }, to: { x: 30, y: 20 } },
  { from: { x: 11, y: 11 }, to: { x: 40, y: 60 } },
  { from: { x: 100, y: 70 }, to: { x: 110, y: 75 } },
];

describe("Flow", () => {
  it("renders one shaft + head per occupied bin, not one per datum", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Flow
          data={passes}
          x={(p) => p.from.x}
          y={(p) => p.from.y}
          x2={(p) => p.to.x}
          y2={(p) => p.to.y}
          binsX={6}
          binsY={5}
        />
      </Pitch>,
    );

    // The first two passes share a bin (close start points); the third is
    // far away in its own bin, so 2 bins total rather than 3 marks.
    expect(container.querySelectorAll('[data-pitchkit-mark="flow-shaft"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-pitchkit-mark="flow-head"]')).toHaveLength(2);
  });

  it("renders nothing for empty data", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Flow data={[]} x={() => 0} y={() => 0} x2={() => 0} y2={() => 0} />
      </Pitch>,
    );

    expect(container.querySelectorAll('[data-pitchkit-mark="flow-shaft"]')).toHaveLength(0);
  });

  it("applies the className prop to both shaft and head", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Flow
          data={[passes[0] as (typeof passes)[number]]}
          x={(p) => p.from.x}
          y={(p) => p.from.y}
          x2={(p) => p.to.x}
          y2={(p) => p.to.y}
          className="pass-flow"
        />
      </Pitch>,
    );

    expect(
      container.querySelector('[data-pitchkit-mark="flow-shaft"]')?.getAttribute("class"),
    ).toBe("pass-flow");
    expect(
      container.querySelector('[data-pitchkit-mark="flow-head"]')?.getAttribute("class"),
    ).toBe("pass-flow");
  });

  it("calls the tooltip accessor with the bin (not the raw datum) on hover", () => {
    const tooltip = vi.fn((bin: { count: number }) => `${bin.count} passes`);
    const { container, getByRole, queryByRole } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Flow
          data={passes}
          x={(p) => p.from.x}
          y={(p) => p.from.y}
          x2={(p) => p.to.x}
          y2={(p) => p.to.y}
          tooltip={tooltip}
        />
      </Pitch>,
    );

    expect(queryByRole("tooltip")).toBeNull();
    const shaft = container.querySelector('[data-pitchkit-mark="flow-shaft"]');
    if (!shaft) throw new Error("flow-shaft mark not found");
    fireEvent.mouseEnter(shaft);
    expect(tooltip).toHaveBeenCalledWith(expect.objectContaining({ count: 2 }), 0);
    expect(getByRole("tooltip").textContent).toBe("2 passes");
    fireEvent.mouseLeave(shaft);
    expect(queryByRole("tooltip")).toBeNull();
  });
});
