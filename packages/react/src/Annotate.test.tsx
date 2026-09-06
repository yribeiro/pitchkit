import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Annotate } from "./Annotate.js";
import { Pitch } from "./Pitch.js";

describe("Annotate", () => {
  it("renders one text element per datum with the resolved label", () => {
    const data: { pos: [number, number]; name: string }[] = [
      { pos: [10, 10], name: "A" },
      { pos: [20, 20], name: "B" },
    ];
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Annotate data={data} x={(d) => d.pos[0]} y={(d) => d.pos[1]} label={(d) => d.name} />
      </Pitch>,
    );

    const marks = container.querySelectorAll('[data-pitchkit-mark="annotate"]');
    expect(marks).toHaveLength(2);
    expect(marks[0]?.textContent).toBe("A");
    expect(marks[1]?.textContent).toBe("B");
  });

  it("offsets the label position by offsetX/offsetY", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Annotate
          data={[{ x: 60, y: 40 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          label={() => "A"}
          offsetY={-10}
        />
      </Pitch>,
    );

    const text = container.querySelector('[data-pitchkit-mark="annotate"]');
    expect(text?.getAttribute("x")).toBe("300");
    expect(text?.getAttribute("y")).toBe("190"); // 200 - 10
  });

  it("applies the className prop to the text element", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Annotate
          data={[{ x: 10, y: 10 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          label={() => "A"}
          className="my-label"
        />
      </Pitch>,
    );

    expect(container.querySelector('[data-pitchkit-mark="annotate"]')?.getAttribute("class")).toBe(
      "my-label",
    );
  });

  it("omits the themed default fill inline style when className is set, so a Tailwind class can take effect", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Annotate
          data={[{ x: 10, y: 10 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          label={() => "A"}
          className="fill-red-500"
        />
      </Pitch>,
    );

    const text = container.querySelector('[data-pitchkit-mark="annotate"]') as SVGElement;
    expect(text.style.fill).toBe("");
  });

  it("shows a tooltip on hover", () => {
    const tooltip = vi.fn(() => "tip");
    const { container, getByRole } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Annotate
          data={[{ x: 10, y: 10 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          label={() => "A"}
          tooltip={tooltip}
        />
      </Pitch>,
    );

    const text = container.querySelector('[data-pitchkit-mark="annotate"]');
    if (!text) throw new Error("annotate mark not found");
    fireEvent.mouseEnter(text);
    expect(getByRole("tooltip").textContent).toBe("tip");
  });
});
