import { fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { GOAL_FRAMES, GOAL_VIEW_ASPECT, computeGoalLayout } from "@pitchkit/core";
import type { GoalFrameId } from "@pitchkit/core";
import { GoalShots } from "./GoalShots.js";
import { GoalView } from "./GoalView.js";
import { useGoalView } from "./goal-view-context.js";

const FRAME_IDS = Object.keys(GOAL_FRAMES) as GoalFrameId[];
const WIDTH = 1000;
const HEIGHT = Math.round(WIDTH / GOAL_VIEW_ASPECT);

const part = (container: HTMLElement, name: string) =>
  container.querySelectorAll(`[data-pitchkit-part="${name}"]`);

describe("GoalView", () => {
  it.each(FRAME_IDS)("%s: draws the goal, the net and the ground", (type) => {
    const { container } = render(<GoalView type={type} width={WIDTH} height={HEIGHT} />);
    expect(part(container, "goal-backdrop")).toHaveLength(1);
    expect(part(container, "goal-ground")).toHaveLength(1);
    expect(part(container, "goal-post")).toHaveLength(2);
    expect(part(container, "goal-crossbar")).toHaveLength(1);
    expect(part(container, "goal-net")).toHaveLength(1);
    expect(part(container, "goal-line")).toHaveLength(1);
    expect(part(container, "six-yard-box")).toHaveLength(1);
    expect(part(container, "penalty-area")).toHaveLength(1);
    expect(part(container, "penalty-spot")).toHaveLength(1);
  });

  it("draws both dimension markers by default, in metres", () => {
    const { container } = render(<GoalView type="statsbomb" width={WIDTH} height={HEIGHT} />);
    expect(part(container, "goal-width-marker")[0]?.textContent).toBe("7.32 m");
    expect(part(container, "goal-height-marker")[0]?.textContent).toBe("2.44 m");
  });

  it("turns each dimension marker off on its own", () => {
    const { container: noWidth } = render(
      <GoalView
        type="statsbomb"
        width={WIDTH}
        height={HEIGHT}
        appearance={{ widthMarker: false }}
      />,
    );
    expect(part(noWidth, "goal-width-marker")).toHaveLength(0);
    expect(part(noWidth, "goal-height-marker")).toHaveLength(1);

    const { container: noHeight } = render(
      <GoalView
        type="statsbomb"
        width={WIDTH}
        height={HEIGHT}
        appearance={{ heightMarker: false }}
      />,
    );
    expect(part(noHeight, "goal-width-marker")).toHaveLength(1);
    expect(part(noHeight, "goal-height-marker")).toHaveLength(0);
  });

  it("labels the markers in yards and feet with imperial units", () => {
    const { container } = render(
      <GoalView
        type="statsbomb"
        width={WIDTH}
        height={HEIGHT}
        appearance={{ units: "imperial" }}
      />,
    );
    expect(part(container, "goal-width-marker")[0]?.textContent).toBe("8 yd");
    expect(part(container, "goal-height-marker")[0]?.textContent).toBe("8 ft");
  });

  it("clips the ground markings to the ground with an id usable in url()", () => {
    const { container } = render(<GoalView type="statsbomb" width={WIDTH} height={HEIGHT} />);
    const clip = container.querySelector("clipPath");
    expect(clip?.id).toMatch(/^pitchkit-goal-[^:]+$/);
    expect(part(container, "goal-line")[0]?.parentElement?.getAttribute("clip-path")).toBe(
      `url(#${clip?.id})`,
    );
  });

  it("fills its container by default, at the view's own aspect ratio", () => {
    const { container } = render(<GoalView type="statsbomb" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe("100%");
    expect(root.getAttribute("style")).toContain(`aspect-ratio: ${GOAL_VIEW_ASPECT}`);
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      `0 0 600 ${Math.round(600 / GOAL_VIEW_ASPECT)}`,
    );
  });

  it("takes a fixed size when given both width and height", () => {
    const { container } = render(<GoalView type="statsbomb" width={500} height={300} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe("500px");
    expect(root.style.height).toBe("300px");
    expect(root.style.aspectRatio).toBe("");
  });

  it("passes className and style to the root", () => {
    const { container } = render(
      <GoalView type="statsbomb" className="my-goal" style={{ maxWidth: 400 }} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe("my-goal");
    expect(root.style.maxWidth).toBe("400px");
  });

  it("themes through --pitch-* variables", () => {
    const { container } = render(<GoalView type="statsbomb" width={WIDTH} height={HEIGHT} />);
    const style = (name: string) => (part(container, name)[0] as SVGElement).getAttribute("style");
    expect(style("goal-backdrop")).toContain("--pitch-goal-backdrop");
    expect(style("goal-ground")).toContain("--pitch-surface");
    expect(style("goal-crossbar")).toContain("--pitch-goal-frame");
    expect(style("goal-line")).toContain("--pitch-lines");
  });

  it("renders on the server", () => {
    const html = renderToString(
      <GoalView type="statsbomb">
        <GoalShots data={[{ y: 40, z: 1 }]} y={(d) => d.y} z={(d) => d.z} />
      </GoalView>,
    );
    expect(html).toContain("<svg");
    expect(html).toContain('data-pitchkit-part="goal-crossbar"');
    expect(html).toContain('data-pitchkit-mark="goal-shot"');
  });
});

describe("GoalShots", () => {
  const layout = computeGoalLayout(WIDTH, HEIGHT);

  it("puts a StatsBomb shot where it crossed the line", () => {
    const { container } = render(
      <GoalView type="statsbomb" width={WIDTH} height={HEIGHT}>
        <GoalShots data={[{ y: 40, z: 4 / 3 }]} y={(d) => d.y} z={(d) => d.z} />
      </GoalView>,
    );
    const circle = container.querySelector('[data-pitchkit-mark="goal-shot"]');
    expect(Number(circle?.getAttribute("cx"))).toBeCloseTo(layout.centreX, 5);
    expect(Number(circle?.getAttribute("cy"))).toBeCloseTo(layout.groundY - 1.22 * layout.scale, 5);
    expect(circle?.hasAttribute("data-pitchkit-clamped")).toBe(false);
  });

  it("pins a shot outside the view to its edge and marks it", () => {
    const { container } = render(
      <GoalView type="statsbomb" width={WIDTH} height={HEIGHT}>
        <GoalShots data={[{ y: 57, z: 7 }]} y={(d) => d.y} z={(d) => d.z} />
      </GoalView>,
    );
    const circle = container.querySelector('[data-pitchkit-mark="goal-shot"]');
    // Pinned one radius (the default 6) inside the edge, so it stays whole.
    expect(Number(circle?.getAttribute("cx"))).toBeCloseTo(layout.left + layout.width - 6, 5);
    expect(Number(circle?.getAttribute("cy"))).toBeCloseTo(layout.top + 6, 5);
    expect(circle?.hasAttribute("data-pitchkit-clamped")).toBe(true);
  });

  it("skips a shot with no height, such as a blocked one", () => {
    const shots = [{ end: [120, 40, 1] }, { end: [110, 38] }];
    const { container } = render(
      <GoalView type="statsbomb" width={WIDTH} height={HEIGHT}>
        <GoalShots data={shots} y={(d) => d.end[1] as number} z={(d) => d.end[2] as number} />
      </GoalView>,
    );
    expect(container.querySelectorAll('[data-pitchkit-mark="goal-shot"]')).toHaveLength(1);
  });

  it("resolves radius, fill, opacity and stroke from accessors", () => {
    const { container } = render(
      <GoalView type="metric" width={WIDTH} height={HEIGHT}>
        <GoalShots
          data={[{ y: 0, z: 1, goal: true }]}
          y={(d) => d.y}
          z={(d) => d.z}
          r={(d) => (d.goal ? 9 : 5)}
          fill={(d) => (d.goal ? "green" : "grey")}
          fillOpacity={0.5}
          stroke="white"
          strokeWidth={2}
        />
      </GoalView>,
    );
    const circle = container.querySelector('[data-pitchkit-mark="goal-shot"]') as SVGElement;
    expect(circle.getAttribute("r")).toBe("9");
    expect(circle.style.fill).toBe("green");
    expect(circle.style.fillOpacity).toBe("0.5");
    expect(circle.style.stroke).toBe("white");
    expect(circle.style.strokeWidth).toBe("2");
  });

  it("themes its default colours, and hands them to a className", () => {
    const { container } = render(
      <GoalView type="metric" width={WIDTH} height={HEIGHT}>
        <GoalShots data={[{ y: 0, z: 1 }]} y={(d) => d.y} z={(d) => d.z} />
        <GoalShots data={[{ y: 0, z: 1 }]} y={(d) => d.y} z={(d) => d.z} className="fill-x" />
      </GoalView>,
    );
    const [themed, classed] = Array.from(
      container.querySelectorAll('[data-pitchkit-mark="goal-shot"]'),
    );
    expect(themed?.getAttribute("style")).toContain("--pitch-marker-primary");
    expect(classed?.getAttribute("class")).toBe("fill-x");
    expect(classed?.getAttribute("style") ?? "").not.toContain("--pitch-marker-primary");
  });

  it("shows a tooltip on hover and hides it on leave", () => {
    const { container, queryByRole } = render(
      <GoalView type="statsbomb" width={WIDTH} height={HEIGHT}>
        <GoalShots
          data={[{ y: 40, z: 1, name: "Palmer" }]}
          y={(d) => d.y}
          z={(d) => d.z}
          tooltip={(d) => d.name}
        />
      </GoalView>,
    );
    const circle = container.querySelector('[data-pitchkit-mark="goal-shot"]') as Element;
    fireEvent.mouseEnter(circle);
    expect(queryByRole("tooltip")?.textContent).toBe("Palmer");
    fireEvent.mouseLeave(circle);
    expect(queryByRole("tooltip")).toBeNull();
  });

  it("throws outside a GoalView", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <svg>
          <GoalShots data={[{ y: 40, z: 1 }]} y={(d) => d.y} z={(d) => d.z} />
        </svg>,
      ),
    ).toThrow("<GoalView>");
    vi.restoreAllMocks();
  });
});

describe("useGoalView", () => {
  it("gives a child the frame, layout and the same mapping the shots use", () => {
    const seen: { frame?: string; x?: number; scale?: number } = {};
    function Probe() {
      const { frame, layout, toPixel } = useGoalView();
      seen.frame = frame.id;
      seen.scale = layout.scale;
      seen.x = toPixel(36, 0)?.x;
      return null;
    }
    render(
      <GoalView type="statsbomb" width={WIDTH} height={HEIGHT}>
        <Probe />
      </GoalView>,
    );
    const layout = computeGoalLayout(WIDTH, HEIGHT);
    expect(seen.frame).toBe("statsbomb");
    expect(seen.scale).toBeCloseTo(layout.scale, 10);
    expect(seen.x).toBeCloseTo(layout.centreX - 3.66 * layout.scale, 5);
  });
});
