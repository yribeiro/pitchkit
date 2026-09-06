import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoalAngle } from "./GoalAngle.js";
import { Pitch } from "./Pitch.js";

describe("GoalAngle", () => {
  it("renders one wedge per datum", () => {
    const shots = [
      { x: 100, y: 40 },
      { x: 90, y: 30 },
    ];
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <GoalAngle data={shots} x={(s) => s.x} y={(s) => s.y} />
      </Pitch>,
    );

    expect(container.querySelectorAll('[data-pitchkit-mark="goal-angle"]')).toHaveLength(2);
  });

  it("each wedge is a triangle (point + two posts)", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <GoalAngle data={[{ x: 100, y: 40 }]} x={(s) => s.x} y={(s) => s.y} />
      </Pitch>,
    );

    const wedge = container.querySelector('[data-pitchkit-mark="goal-angle"]');
    const points = wedge?.getAttribute("points")?.trim().split(/\s+/);
    expect(points).toHaveLength(3);
  });

  it("respects an explicit goal side over the nearest-goal default", () => {
    const { container: nearest } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <GoalAngle data={[{ x: 100, y: 40 }]} x={(s) => s.x} y={(s) => s.y} goal="left" />
      </Pitch>,
    );
    const { container: right } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <GoalAngle data={[{ x: 100, y: 40 }]} x={(s) => s.x} y={(s) => s.y} goal="right" />
      </Pitch>,
    );

    const leftPoints = nearest
      .querySelector('[data-pitchkit-mark="goal-angle"]')
      ?.getAttribute("points");
    const rightPoints = right
      .querySelector('[data-pitchkit-mark="goal-angle"]')
      ?.getAttribute("points");
    expect(leftPoints).not.toBe(rightPoints);
  });

  it("applies the className prop", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <GoalAngle
          data={[{ x: 100, y: 40 }]}
          x={(s) => s.x}
          y={(s) => s.y}
          className="shot-wedge"
        />
      </Pitch>,
    );

    expect(
      container.querySelector('[data-pitchkit-mark="goal-angle"]')?.getAttribute("class"),
    ).toBe("shot-wedge");
  });

  it("calls the tooltip accessor on hover and clears it on leave", () => {
    const tooltip = vi.fn(() => "Shot");
    const { container, getByRole, queryByRole } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <GoalAngle data={[{ x: 100, y: 40 }]} x={(s) => s.x} y={(s) => s.y} tooltip={tooltip} />
      </Pitch>,
    );

    expect(queryByRole("tooltip")).toBeNull();
    const wedge = container.querySelector('[data-pitchkit-mark="goal-angle"]');
    if (!wedge) throw new Error("goal-angle mark not found");
    fireEvent.mouseEnter(wedge);
    expect(getByRole("tooltip").textContent).toBe("Shot");
    fireEvent.mouseLeave(wedge);
    expect(queryByRole("tooltip")).toBeNull();
  });
});
