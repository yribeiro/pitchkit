import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pitch } from "./Pitch.js";
import { Scatter } from "./Scatter.js";
import { VerticalPitch } from "./VerticalPitch.js";

const PARTS_WITH_EXPECTED_COUNT: Record<string, number> = {
  surface: 1,
  outline: 1,
  "halfway-line": 1,
  "center-circle": 1,
  "center-spot": 1,
  "penalty-area": 2,
  "six-yard-box": 2,
  "penalty-spot": 2,
  "penalty-arc": 2,
  "corner-arc": 4,
  goal: 2,
};

describe("Pitch", () => {
  it("renders an svg with the requested viewBox when width/height are explicit", () => {
    const { container } = render(<Pitch type="statsbomb" width={600} height={400} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 600 400");
  });

  it("renders every expected pitch-part element exactly once/twice/four times as appropriate", () => {
    const { container } = render(<Pitch type="statsbomb" width={600} height={400} />);

    for (const [part, expectedCount] of Object.entries(PARTS_WITH_EXPECTED_COUNT)) {
      expect(
        container.querySelectorAll(`[data-pitchkit-part="${part}"]`),
        `expected ${expectedCount} "${part}" element(s)`,
      ).toHaveLength(expectedCount);
    }
  });

  it.each(["statsbomb", "opta", "uefa"] as const)(
    "renders a structurally correct pitch for %s",
    (type) => {
      const { container } = render(<Pitch type={type} width={600} height={400} />);
      expect(container.querySelectorAll("[data-pitchkit-part]").length).toBeGreaterThan(0);
    },
  );

  it("box goalType renders goal-box rects instead of goal lines", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400} appearance={{ goalType: "box" }} />,
    );
    expect(container.querySelectorAll('[data-pitchkit-part="goal"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-pitchkit-part="goal-box"]')).toHaveLength(2);
  });

  it("paints the stroke-only outline border after the stripes so opaque stripes can't mask it", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400} appearance={{ stripes: true }} />,
    );
    const parts = Array.from(container.querySelectorAll("[data-pitchkit-part]")).map((el) =>
      el.getAttribute("data-pitchkit-part"),
    );

    const outlineIndex = parts.indexOf("outline");
    expect(parts.indexOf("surface")).toBeLessThan(parts.indexOf("stripe"));
    expect(outlineIndex).toBeGreaterThan(parts.lastIndexOf("stripe"));
    expect(outlineIndex).toBe(parts.length - 1);

    const outline = container.querySelector('[data-pitchkit-part="outline"]');
    expect((outline as SVGRectElement | null)?.style.fill).toBe("none");
  });

  it("paints markings below the children by default, so marks sit on top of the lines", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter data={[{ x: 60, y: 40 }]} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const painted = Array.from(
      container.querySelectorAll("[data-pitchkit-part], [data-pitchkit-mark]"),
    ).map((el) => el.getAttribute("data-pitchkit-part") ?? el.getAttribute("data-pitchkit-mark"));

    expect(painted.lastIndexOf("outline")).toBeLessThan(painted.indexOf("scatter"));
    expect(container.querySelectorAll('[data-pitchkit-layer="pitch-markings"]')).toHaveLength(0);
  });

  it("linesOnTop paints the markings after the children, keeping them visible under an opaque layer", () => {
    const { container } = render(
      <Pitch
        type="statsbomb"
        width={600}
        height={400}
        appearance={{ stripes: true, linesOnTop: true }}
      >
        <Scatter data={[{ x: 60, y: 40 }]} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const painted = Array.from(
      container.querySelectorAll("[data-pitchkit-part], [data-pitchkit-mark]"),
    ).map((el) => el.getAttribute("data-pitchkit-part") ?? el.getAttribute("data-pitchkit-mark"));

    // Every marking now paints after the layer children...
    expect(painted.indexOf("scatter")).toBeLessThan(painted.indexOf("halfway-line"));
    expect(painted.indexOf("scatter")).toBeLessThan(painted.lastIndexOf("outline"));
    // ...but the grass still paints first, underneath everything.
    expect(painted.indexOf("surface")).toBe(0);
    expect(painted.lastIndexOf("stripe")).toBeLessThan(painted.indexOf("scatter"));
  });

  it("emits the markings in their own group only when linesOnTop is set", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400} appearance={{ linesOnTop: true }} />,
    );

    expect(container.querySelectorAll('[data-pitchkit-layer="pitch"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-pitchkit-layer="pitch-markings"]')).toHaveLength(1);
    // The full set of parts is still painted exactly once, just regrouped.
    for (const [part, count] of Object.entries(PARTS_WITH_EXPECTED_COUNT)) {
      expect(container.querySelectorAll(`[data-pitchkit-part="${part}"]`)).toHaveLength(count);
    }
  });

  it("stripes appearance paints stripe bands", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400} appearance={{ stripes: 6 }} />,
    );
    expect(container.querySelectorAll('[data-pitchkit-part="stripe"]')).toHaveLength(3);
  });

  it("VerticalPitch renders with vertical orientation (aspect swapped)", () => {
    const { container } = render(<VerticalPitch type="statsbomb" width={400} height={600} />);
    const outline = container.querySelector('[data-pitchkit-part="outline"]');
    // statsbomb 120x80 into 400x600 vertical -> scale = min(400/80, 600/120) = 5
    // rendered outline width should be 80*5=400 (fills width), height 120*5=600
    expect(outline?.getAttribute("width")).toBe("400");
    expect(outline?.getAttribute("height")).toBe("600");
  });

  it("an explicit-size half-pitch crop matching that aspect ratio has no letterbox offset", () => {
    // 300x400 matches the half-crop's own aspect (60x80 provider units), so
    // there's no contain-fit margin for the other half's markings to leak
    // into — the crop's near edge (x0=60) should land exactly at pixel x=0.
    const { container } = render(
      <Pitch type="statsbomb" width={300} height={400} crop={{ x0: 60, y0: 0, x1: 120, y1: 80 }} />,
    );
    const outline = container.querySelector('[data-pitchkit-part="outline"]');
    // The full outline still spans provider x=[0,120] (unclipped, relying on
    // the SVG's own viewBox clipping) — its far (x=120) edge lands exactly
    // on the container's right edge, its near (x=0, off-crop) edge lands
    // exactly one container-width to the left, outside the visible viewBox.
    expect(outline?.getAttribute("x")).toBe("-300");
    expect(outline?.getAttribute("width")).toBe("600");
  });

  it("renders children (layer components) inside the svg", () => {
    const { container } = render(
      <Pitch type="statsbomb" width={600} height={400}>
        <g data-testid="custom-child" />
      </Pitch>,
    );
    const svg = container.querySelector("svg");
    expect(svg?.querySelector('[data-testid="custom-child"]')).not.toBeNull();
  });
});

describe("Pitch responsive sizing (no explicit width/height)", () => {
  class MockResizeObserver {
    static instances: MockResizeObserver[] = [];
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      MockResizeObserver.instances.push(this);
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    trigger(rect: { width: number; height: number }): void {
      this.callback(
        [{ contentRect: rect } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
  }

  afterEach(() => {
    MockResizeObserver.instances = [];
    vi.unstubAllGlobals();
  });

  it("uses a fallback size matching the pitch's own aspect ratio before any measurement", () => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    const { container } = render(<Pitch type="statsbomb" />);

    const svg = container.querySelector("svg");
    const viewBox = svg?.getAttribute("viewBox");
    const [, , w, h] = viewBox?.split(" ").map(Number) ?? [];
    // statsbomb aspect = 120/80 = 1.5
    expect((w ?? 0) / (h ?? 1)).toBeCloseTo(1.5, 5);
  });

  it("VerticalPitch's fallback aspect matches a half-pitch crop, not the full pitch", () => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    const { container } = render(
      <VerticalPitch type="statsbomb" crop={{ x0: 60, y0: 0, x1: 120, y1: 80 }} />,
    );

    const svg = container.querySelector("svg");
    const viewBox = svg?.getAttribute("viewBox");
    const [, , w, h] = viewBox?.split(" ").map(Number) ?? [];
    // Cropped extent vertical aspect = width(80) / half-length(60) = 4/3, not
    // the full-pitch vertical aspect of 80/120 = 2/3 — the bug this guards
    // against sized the fallback box for the full pitch, leaving room for
    // the other half's markings to bleed into the extra space.
    expect((w ?? 0) / (h ?? 1)).toBeCloseTo(4 / 3, 5);
  });

  it("updates the viewBox once ResizeObserver reports a measured size", () => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    const { container } = render(<Pitch type="statsbomb" />);

    const observer = MockResizeObserver.instances[0];
    if (!observer) throw new Error("no ResizeObserver instance created");
    act(() => {
      observer.trigger({ width: 300, height: 200 });
    });

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 300 200");
  });
});

describe("Pitch with a center-origin provider", () => {
  it("draws SkillCorner's raw coordinates without any lifting", () => {
    // The whole point of the pitch type: (0, 0) is the centre spot, so data
    // straight out of @pitchkit/data-providers/skillcorner plots as-is.
    const { container } = render(
      <Pitch type="skillcorner" width={1050} height={680}>
        <Scatter data={[{ x: 0, y: 0 }]} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const mark = container.querySelector('[data-pitchkit-mark="scatter"]');
    expect(Number(mark?.getAttribute("cx"))).toBeCloseTo(525, 6);
    expect(Number(mark?.getAttribute("cy"))).toBeCloseTo(340, 6);
  });

  it("puts the negative corner at the bottom left, since y points up", () => {
    const { container } = render(
      <Pitch type="skillcorner" width={1050} height={680}>
        <Scatter data={[{ x: -52.5, y: -34 }]} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const mark = container.querySelector('[data-pitchkit-mark="scatter"]');
    expect(Number(mark?.getAttribute("cx"))).toBeCloseTo(0, 6);
    expect(Number(mark?.getAttribute("cy"))).toBeCloseTo(680, 6);
  });

  it("honours a per-match extent override", () => {
    // A 106 m pitch: the touchline moves out, so the same coordinate lands
    // slightly further in than it would on the 105 m default.
    const { container } = render(
      <Pitch type="skillcorner" dimensions={{ length: 106, width: 68 }} width={1060} height={680}>
        <Scatter data={[{ x: -53, y: 0 }]} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    const mark = container.querySelector('[data-pitchkit-mark="scatter"]');
    expect(Number(mark?.getAttribute("cx"))).toBeCloseTo(0, 6);
  });

  it("refuses to rescale a normalized grid", () => {
    expect(() =>
      render(
        <Pitch type="opta" dimensions={{ length: 105, width: 68 }} width={100} height={100} />,
      ),
    ).toThrow(/normalized/);
  });
});
