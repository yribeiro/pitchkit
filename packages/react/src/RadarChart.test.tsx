import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RadarChart } from "./RadarChart.js";
import { useRadarChart } from "./radar-context.js";
import type { PolarMetric, PolarSeries } from "./polar-types.js";
import type { RadarChartProps } from "./radar-types.js";

const metrics: PolarMetric[] = [
  { id: "npxg", label: "npxG", min: 0, max: 0.6 },
  { id: "shots", label: "Shots", min: 0, max: 4 },
  { id: "turnovers", label: "Turnovers", min: 1, max: 5, lowerIsBetter: true },
  { id: "pressures", label: "Pressures", min: 5, max: 25 },
];

const winger: PolarSeries = {
  id: "a",
  label: "Winger A",
  values: { npxg: 0.3, shots: 2, turnovers: 1, pressures: 15 },
};
const fullback: PolarSeries = {
  id: "b",
  label: "Full-back B",
  values: { npxg: 0.1, shots: 1, turnovers: 3, pressures: 20 },
};

function renderChart(props: Partial<RadarChartProps> = {}) {
  return render(
    <RadarChart metrics={metrics} series={[winger]} width={500} height={500} {...props} />,
  );
}

function parts(container: HTMLElement, part: string): Element[] {
  return Array.from(container.querySelectorAll(`[data-pitchkit-part="${part}"]`));
}

afterEach(() => vi.restoreAllMocks());

describe("RadarChart: shapes", () => {
  /** Each vertex's distance from the centre, from a shape's `points`. */
  function vertexRadii(container: HTMLElement, series = 0): number[] {
    const points = parts(container, "radar-shape")[series]?.getAttribute("points") ?? "";
    return points.split(" ").map((p) => {
      const [x, y] = p.split(",").map(Number) as [number, number];
      return Math.hypot(x - 250, y - 250);
    });
  }

  it("draws one shape per series, with a vertex per metric and no markers", () => {
    const { container } = renderChart({ series: [winger, fullback] });
    expect(parts(container, "radar-shape")).toHaveLength(2);
    expect(vertexRadii(container, 1)).toHaveLength(4);
    expect(container.querySelectorAll("[data-pitchkit-series] circle")).toHaveLength(0);
  });

  it("puts a lower-is-better metric's best value at the rim", () => {
    const { container } = renderChart();
    const [npxg, , turnovers] = vertexRadii(container) as [number, number, number];
    // Turnovers = 1, its min, is the best value: it reaches the rim.
    expect(turnovers).toBeGreaterThan(npxg);
  });

  it("pins a value beyond the range to the rim, and the readout says so", () => {
    const { container } = renderChart({
      series: [{ id: "a", values: { npxg: 0.9, shots: 2, turnovers: 2, pressures: 10 } }],
    });
    const radii = renderChart().container;
    const [overshoot] = vertexRadii(container) as [number];
    const [rimTurnovers] = vertexRadii(radii).slice(2) as [number];
    expect(overshoot).toBeCloseTo(rimTurnovers);
    fireEvent.focus(parts(container, "radar-label")[0] as Element);
    expect(screen.getByRole("tooltip").textContent).toContain("off scale");
  });

  it("pulls the outline to the centre for a missing value", () => {
    const { container } = renderChart({
      series: [{ id: "a", values: { npxg: 0.3, shots: null, turnovers: 2, pressures: 10 } }],
    });
    expect(vertexRadii(container)[1]).toBe(0);
  });

  it("bands a single series in two tones, but not several", () => {
    const one = renderChart();
    expect(parts(one.container, "radar-band-tone").length).toBeGreaterThan(0);
    one.unmount();

    const two = renderChart({ series: [winger, fullback] });
    expect(parts(two.container, "radar-band-tone")).toHaveLength(0);
    two.unmount();

    const off = renderChart({ appearance: { bands: false } });
    expect(parts(off.container, "radar-band-tone")).toHaveLength(0);
  });

  it("draws rings + 1 bands, honouring a custom ring count", () => {
    const { container } = renderChart({ rings: 6 });
    expect(parts(container, "radar-band")).toHaveLength(7);
  });
});

describe("RadarChart: colour", () => {
  it("takes the series slot colour by default", () => {
    // happy-dom drops `color: var(…)` from inline styles, so read the
    // server-rendered markup, which keeps it.
    const html = renderToString(
      <RadarChart metrics={metrics} series={[winger, fullback]} width={500} height={500} />,
    );
    expect(html).toMatch(/data-pitchkit-series="b"[^>]*style="color:var\(--pitch-series-2/);
  });

  it("lets a className replace the themed default", () => {
    const { container } = renderChart({ series: [{ ...winger, className: "text-rose-500" }] });
    const group = container.querySelector('[data-pitchkit-series="a"]') as HTMLElement;
    expect(group.getAttribute("class")).toBe("text-rose-500");
    expect(group.style.color).toBe("");
  });

  it("shows a legend for two or more series only", () => {
    expect(parts(renderChart().container, "radar-legend")).toHaveLength(0);
    expect(
      parts(renderChart({ series: [winger, fullback] }).container, "radar-legend"),
    ).toHaveLength(1);
  });
});

describe("RadarChart: ring values", () => {
  it("prints each ring's value on every axis, counting down on a flipped one", () => {
    const { container } = renderChart();
    const ticks = parts(container, "radar-tick");
    expect(ticks).toHaveLength(4);
    expect(
      Array.from((ticks[2] as Element).querySelectorAll("text")).map((t) => t.textContent),
    ).toEqual(["4", "3", "2", "1"]);
  });

  it("rounds ring values to two significant figures", () => {
    const { container } = renderChart({
      metrics: [...metrics.slice(0, 3), { id: "pressures", min: 0.5, max: 4 }],
    });
    const last = Array.from(
      (parts(container, "radar-tick")[3] as Element).querySelectorAll("text"),
    );
    expect(last.map((t) => t.textContent)).toEqual(["1.4", "2.3", "3.1", "4"]);
  });

  it("can be turned off, and is off by default on a narrow chart", () => {
    expect(
      parts(renderChart({ appearance: { rangeLabels: false } }).container, "radar-tick"),
    ).toHaveLength(0);
    expect(parts(renderChart({ width: 340, height: 340 }).container, "radar-tick")).toHaveLength(0);
  });

  it("uses the caller's format", () => {
    const { container } = renderChart({ format: (v) => `${v}!` });
    expect(parts(container, "radar-tick")[1]?.querySelector("text")?.textContent).toBe("1!");
  });
});

describe("RadarChart: labels", () => {
  const labelAt = (container: HTMLElement, i: number) =>
    parts(container, "radar-label")[i] as Element;

  it("rotates labels along the rim by default, turning the lower half upright", () => {
    const { container } = renderChart();
    expect(labelAt(container, 1).getAttribute("transform")).toContain("rotate(90)");
    // The bottom axis (180°) is turned to 360°, which reads the right way up.
    expect(labelAt(container, 2).getAttribute("transform")).toContain("rotate(360)");
  });

  it("runs labels along the axis when radial, anchoring the left half at its end", () => {
    const { container } = renderChart({ labelRotation: "radial" });
    expect(labelAt(container, 1).getAttribute("transform")).toContain("rotate(0)");
    expect(labelAt(container, 3).querySelector("text")?.getAttribute("text-anchor")).toBe("end");
  });

  it("keeps labels upright when horizontal", () => {
    const { container } = renderChart({ labelRotation: "horizontal" });
    expect(labelAt(container, 1).getAttribute("transform")).toContain("rotate(0)");
  });

  it("wraps long labels and marks a lower-is-better axis", () => {
    const { container } = renderChart({
      metrics: [{ id: "npxg", label: "Progressive passes received" }, ...metrics.slice(1)],
    });
    expect(labelAt(container, 0).querySelectorAll("tspan")).toHaveLength(3);
    expect(labelAt(container, 2).textContent).toBe("Turnovers ↓");
  });

  it("falls back to the metric id", () => {
    const { container } = renderChart({ metrics: [{ id: "xg" }, ...metrics.slice(1)] });
    expect(labelAt(container, 0).textContent).toBe("xg");
  });
});

describe("RadarChart: readout", () => {
  it("shows every series' value for a focused axis", () => {
    const { container } = renderChart({ series: [winger, fullback] });
    fireEvent.focus(parts(container, "radar-label")[3] as Element);
    const readout = screen.getByRole("tooltip");
    expect(readout.textContent).toContain("Pressures");
    expect(readout.textContent).toContain("Winger A15");
    expect(readout.textContent).toContain("Full-back B20");
  });

  it("says lower is better, off scale and no data where they apply", () => {
    const { container } = renderChart({
      series: [{ id: "a", values: { turnovers: 9 } }],
    });
    fireEvent.focus(parts(container, "radar-label")[2] as Element);
    expect(screen.getByRole("tooltip").textContent).toContain("lower is better");
    expect(screen.getByRole("tooltip").textContent).toContain("off scale");
    fireEvent.focus(parts(container, "radar-label")[0] as Element);
    expect(screen.getByRole("tooltip").textContent).toContain("No data");
  });

  it("follows the pointer to the nearest axis and clears when a mouse leaves", () => {
    const { container } = renderChart();
    const svg = container.querySelector("svg") as SVGSVGElement;
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 500,
    } as DOMRect);
    const disc = container.querySelector('circle[fill="transparent"]') as Element;

    // Straight right of the centre is the second axis.
    fireEvent.pointerMove(disc, { clientX: 400, clientY: 250 });
    expect(screen.getByRole("tooltip").textContent).toContain("Shots");
    fireEvent.pointerMove(disc, { clientX: 250, clientY: 120 });
    expect(screen.getByRole("tooltip").textContent).toContain("npxG");

    fireEvent.pointerLeave(disc, { pointerType: "mouse" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("ignores the pointer before the chart has a size", () => {
    const { container } = renderChart();
    const disc = container.querySelector('circle[fill="transparent"]') as Element;
    fireEvent.pointerMove(disc, { clientX: 400, clientY: 250 });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("keeps a touch readout until a press outside the chart", () => {
    const { container } = renderChart();
    const label = parts(container, "radar-label")[0] as Element;
    fireEvent.pointerEnter(label, { pointerType: "touch" });
    fireEvent.pointerLeave(label, { pointerType: "touch" });
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("RadarChart: click to detail", () => {
  it("makes nothing clickable without renderDetail", () => {
    const { container } = renderChart();
    expect(parts(container, "radar-label")[0]?.getAttribute("role")).toBeNull();
  });

  it("swaps the chart for the detail view, and Back restores it with focus", () => {
    const renderDetail = vi.fn(() => <p>shot map</p>);
    const { container } = renderChart({ series: [winger, fullback], renderDetail });
    const label = parts(container, "radar-label")[1] as HTMLElement;
    expect(label.getAttribute("role")).toBe("button");

    fireEvent.click(label);
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByText("shot map")).toBeTruthy();
    expect(screen.getByRole("heading").textContent).toBe("Shots");
    expect(screen.getByText("Winger A 2 · Full-back B 1")).toBeTruthy();
    expect(renderDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        metric: metrics[1],
        series: undefined,
        values: { a: 2, b: 1 },
      }),
    );
    expect(document.activeElement).toBe(screen.getByRole("heading"));

    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(container.querySelector("svg")).not.toBeNull();
    expect(document.activeElement?.getAttribute("data-pitchkit-metric")).toBe("shots");
  });

  it("opens with Enter or Space and closes with Escape or close()", () => {
    let close = () => {};
    const { container } = renderChart({
      renderDetail: (ctx) => {
        close = ctx.close;
        return <p>detail</p>;
      },
    });
    fireEvent.keyDown(parts(container, "radar-label")[0] as Element, { key: "Enter" });
    expect(screen.getByText("detail")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("heading"), { key: "Escape" });
    expect(screen.queryByText("detail")).toBeNull();

    fireEvent.keyDown(parts(container, "radar-label")[0] as Element, { key: " " });
    expect(screen.getByText("detail")).toBeTruthy();
    act(() => close());
    expect(screen.queryByText("detail")).toBeNull();

    // Any other key does nothing.
    fireEvent.keyDown(parts(container, "radar-label")[0] as Element, { key: "a" });
    expect(screen.queryByText("detail")).toBeNull();
  });

  it("can be controlled", () => {
    const onSelectedChange = vi.fn();
    const { container, rerender } = renderChart({
      renderDetail: () => <p>detail</p>,
      selected: null,
      onSelectedChange,
    });
    fireEvent.click(parts(container, "radar-label")[0] as Element);
    expect(onSelectedChange).toHaveBeenCalledWith({ metricId: "npxg" });
    // Controlled: nothing opens until the caller says so.
    expect(screen.queryByText("detail")).toBeNull();

    rerender(
      <RadarChart
        metrics={metrics}
        series={[winger]}
        width={500}
        height={500}
        renderDetail={() => <p>detail</p>}
        selected={{ metricId: "npxg" }}
        onSelectedChange={onSelectedChange}
      />,
    );
    expect(screen.getByText("detail")).toBeTruthy();
  });

  it("shows the chart for a selection naming an unknown metric", () => {
    const { container } = renderChart({
      renderDetail: () => <p>detail</p>,
      selected: { metricId: "nope" },
    });
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("shows a dash for a series with no value in the detail heading", () => {
    renderChart({
      series: [winger, { id: "c", values: {} }],
      renderDetail: () => null,
      selected: { metricId: "npxg" },
    });
    expect(screen.getByText("Winger A 0.3 · c –")).toBeTruthy();
  });
});

describe("RadarChart: annotations and warnings", () => {
  it("gives children the geometry through useRadarChart()", () => {
    function Benchmark() {
      const { pointAt, angleOf, outer } = useRadarChart();
      const point = pointAt("npxg", 0.6);
      return (
        <circle
          data-testid="mark"
          cx={point?.[0]}
          cy={point?.[1]}
          r={outer}
          data-angle={angleOf("shots")}
          data-missing={String(pointAt("nope", 1))}
        />
      );
    }
    renderChart({ children: <Benchmark /> });
    const mark = screen.getByTestId("mark");
    expect(Number(mark.getAttribute("cy"))).toBeCloseTo(250 - Number(mark.getAttribute("r")));
    expect(Number(mark.getAttribute("data-angle"))).toBeCloseTo(Math.PI / 2);
    expect(mark.getAttribute("data-missing")).toBe("undefined");
  });

  it("throws when useRadarChart() is used outside a chart", () => {
    function Stray() {
      useRadarChart();
      return null;
    }
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Stray />)).toThrow("inside <RadarChart>");
  });

  it("warns in development about too many series or too few metrics", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderChart({ series: [winger, fullback, { id: "c", values: {} }, { id: "d", values: {} }] });
    renderChart({ metrics: metrics.slice(0, 2) });
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
