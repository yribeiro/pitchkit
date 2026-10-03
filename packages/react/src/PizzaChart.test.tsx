import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PizzaChart } from "./PizzaChart.js";
import { usePizzaChart } from "./pizza-context.js";
import type { PizzaChartProps, PizzaMetric, PizzaSeries } from "./pizza-types.js";

const metrics: PizzaMetric[] = [
  { id: "npxg", label: "npxG", group: "Attacking" },
  { id: "shots", label: "Shots", group: "Attacking" },
  { id: "turnovers", label: "Turnovers", group: "Possession", lowerIsBetter: true },
  { id: "pressures", label: "Pressures", group: "Defending" },
];

const winger: PizzaSeries = {
  id: "a",
  label: "Winger A",
  values: { npxg: 90, shots: 60, turnovers: 80, pressures: 30 },
};
const fullback: PizzaSeries = {
  id: "b",
  label: "Full-back B",
  values: { npxg: 40, shots: 70, turnovers: 20, pressures: 85 },
};

function renderChart(props: Partial<PizzaChartProps> = {}) {
  return render(
    <PizzaChart metrics={metrics} series={[winger]} width={500} height={500} {...props} />,
  );
}

function parts(container: HTMLElement, part: string): Element[] {
  return Array.from(container.querySelectorAll(`[data-pitchkit-part="${part}"]`));
}

const slices = (container: HTMLElement, seriesId?: string) =>
  parts(container, "pizza-slice").filter(
    (el) => seriesId === undefined || el.getAttribute("data-pitchkit-series") === seriesId,
  );

/** A slice's length, read from the radius of its outer arc. */
function tipOf(slice: Element): number {
  const d = slice.querySelector("path")?.getAttribute("d") ?? "";
  return Number(/A([\d.]+) /.exec(d)?.[1]);
}

afterEach(() => vi.restoreAllMocks());

describe("PizzaChart: slices", () => {
  it("draws a slice per metric for one series", () => {
    const { container } = renderChart();
    expect(slices(container)).toHaveLength(4);
    expect(parts(container, "pizza-wedge")).toHaveLength(4);
  });

  it("makes a longer value a longer slice", () => {
    const { container } = renderChart();
    const [npxg, shots] = slices(container) as [Element, Element];
    expect(tipOf(npxg)).toBeGreaterThan(tipOf(shots));
  });

  it("flips a lower-is-better metric so a high percentile is a short slice", () => {
    const { container } = renderChart();
    const all = slices(container);
    // Turnovers = 80 is the 80th percentile of turnovers, which is worse, so
    // shorter than shots = 60 even though the number is higher.
    expect(tipOf(all[2] as Element)).toBeLessThan(tipOf(all[1] as Element));
  });

  it("draws no slice for a missing value, and pins one past the range, flagged", () => {
    const { container } = renderChart({
      series: [{ id: "a", values: { npxg: 140, shots: null, turnovers: 50, pressures: 50 } }],
    });
    expect(slices(container)).toHaveLength(3);
    const [first] = slices(container) as [Element];
    expect(first.hasAttribute("data-pitchkit-clamped")).toBe(true);
    expect(tipOf(first)).toBeGreaterThan(tipOf(slices(container)[1] as Element));
  });

  it("honours a metric's own range", () => {
    const { container } = renderChart({
      metrics: [{ id: "npxg", min: 0, max: 0.6 }, ...metrics.slice(1)],
      series: [{ id: "a", values: { npxg: 0.3, shots: 50, turnovers: 50, pressures: 50 } }],
    });
    const all = slices(container);
    expect(tipOf(all[0] as Element)).toBeCloseTo(tipOf(all[1] as Element));
  });

  it("draws dashed rings and a solid rim", () => {
    const { container } = renderChart();
    const rings = parts(container, "pizza-ring");
    expect(rings).toHaveLength(4);
    expect((rings[3] as SVGElement).style.strokeDasharray).toBe("");
    expect((rings[0] as SVGElement).style.strokeDasharray).toBe("3 3");
  });
});

describe("PizzaChart: colour", () => {
  it("colours rim arcs from the slots after the series", () => {
    const html = renderToString(
      <PizzaChart
        metrics={metrics}
        series={[winger, { ...winger, id: "other" }]}
        width={500}
        height={500}
      />,
    );
    const rims = [
      ...html.matchAll(/data-pitchkit-part="pizza-rim"[^>]*style="color:var\((--pitch-series-\d)/g),
    ];
    expect(rims.length).toBeGreaterThan(0);
    for (const m of rims) expect(["--pitch-series-1", "--pitch-series-2"]).not.toContain(m[1]);
  });

  it("colours one series' slices by group, in order of first appearance", () => {
    // happy-dom drops `color: var(…)` from inline styles, so read the
    // server-rendered markup, which keeps it.
    const html = renderToString(
      <PizzaChart metrics={metrics} series={[winger]} width={500} height={500} />,
    );
    const colours = [
      ...html.matchAll(
        /data-pitchkit-part="pizza-slice"[^>]*style="color:var\((--pitch-series-\d)/g,
      ),
    ];
    expect(colours.map((m) => m[1])).toEqual([
      "--pitch-series-1",
      "--pitch-series-1",
      "--pitch-series-2",
      "--pitch-series-3",
    ]);
  });

  it("lets a group take a colour or a class, the class dropping the default", () => {
    const { container } = renderChart({
      groups: { Attacking: { className: "text-sky-500" }, Defending: { color: "#123456" } },
    });
    const [npxg, , , pressures] = slices(container) as [HTMLElement, Element, Element, HTMLElement];
    expect(npxg.getAttribute("class")).toBe("text-sky-500");
    expect(npxg.style.color).toBe("");
    expect(pressures.style.color).toBe("#123456");
  });

  it("colours several series by series and shows the group on the rim", () => {
    const { container } = renderChart({ series: [winger, fullback] });
    expect(parts(container, "pizza-rim")).toHaveLength(4);
    const html = renderToString(
      <PizzaChart metrics={metrics} series={[winger, fullback]} width={500} height={500} />,
    );
    expect(html).toMatch(/data-pitchkit-series="b"[^>]*style="color:var\(--pitch-series-2/);
  });

  it("lets a series className replace its themed default", () => {
    const { container } = renderChart({
      series: [winger, { ...fullback, className: "text-rose-500" }],
    });
    const b = slices(container, "b")[0] as HTMLElement;
    expect(b.getAttribute("class")).toBe("text-rose-500");
    expect(b.style.color).toBe("");
  });

  it("falls back to the series colour for a metric with no group", () => {
    const html = renderToString(
      <PizzaChart
        metrics={[{ id: "npxg" }, ...metrics.slice(1)]}
        series={[winger]}
        width={500}
        height={500}
      />,
    );
    expect(html).toMatch(/data-pitchkit-metric="npxg"[^>]*style="color:var\(--pitch-series-1/);
  });

  it("legends the groups for one series and the series for several", () => {
    const one = renderChart();
    expect(one.container.querySelector('[data-pitchkit-part="pizza-legend"]')?.textContent).toBe(
      "AttackingPossessionDefending",
    );
    one.unmount();
    const two = renderChart({ series: [winger, fullback] });
    expect(two.container.querySelector('[data-pitchkit-part="pizza-legend"]')?.textContent).toBe(
      "Winger AFull-back B",
    );
    two.unmount();
    expect(
      renderChart({ appearance: { legend: false } }).container.querySelector(
        '[data-pitchkit-part="pizza-legend"]',
      ),
    ).toBeNull();
  });

  it("has no legend for one series with no groups", () => {
    const { container } = renderChart({
      metrics: metrics.map((m) => ({ ...m, group: undefined })),
    });
    expect(container.querySelector('[data-pitchkit-part="pizza-legend"]')).toBeNull();
  });
});

describe("PizzaChart: several series", () => {
  it("gives each series its own sub-wedge side by side", () => {
    const { container } = renderChart({ series: [winger, fullback] });
    const a = slices(container, "a")[0]?.querySelector("path")?.getAttribute("d");
    const b = slices(container, "b")[0]?.querySelector("path")?.getAttribute("d");
    expect(a).not.toBe(b);
    // Separate blanks per series, so each tints in its own colour.
    expect(parts(container, "pizza-blank")).toHaveLength(8);
  });

  it("overlays series on one wedge, largest first so the smaller shows on top", () => {
    const { container } = renderChart({ series: [winger, fullback], seriesLayout: "overlay" });
    const wedge = parts(container, "pizza-wedge")[0] as Element;
    const order = Array.from(wedge.querySelectorAll('[data-pitchkit-part="pizza-slice"]')).map(
      (el) => el.getAttribute("data-pitchkit-series"),
    );
    // npxG: a = 90, b = 40, so a is drawn first and b sits over it.
    expect(order).toEqual(["a", "b"]);
    const second = parts(container, "pizza-wedge")[1] as Element;
    // shots: a = 60, b = 70, so b first.
    expect(
      Array.from(second.querySelectorAll('[data-pitchkit-part="pizza-slice"]')).map((el) =>
        el.getAttribute("data-pitchkit-series"),
      ),
    ).toEqual(["b", "a"]);
    // One neutral blank per wedge.
    expect(parts(container, "pizza-blank")).toHaveLength(4);
  });
});

describe("PizzaChart: value boxes", () => {
  it("prints each value in every layout", () => {
    expect(parts(renderChart().container, "pizza-value")).toHaveLength(4);
    expect(
      parts(
        renderChart({ series: [winger, fullback], seriesLayout: "overlay" }).container,
        "pizza-value",
      ),
    ).toHaveLength(8);
    expect(
      parts(renderChart({ series: [winger, fullback] }).container, "pizza-value"),
    ).toHaveLength(8);
  });

  it("can be turned off", () => {
    expect(
      parts(renderChart({ appearance: { values: false } }).container, "pizza-value"),
    ).toHaveLength(0);
  });

  it("drops a box that would not fit its sliver of arc", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ id: `m${i}`, group: "G" }));
    const values = Object.fromEntries(many.map((m) => [m.id, 80]));
    const { container } = renderChart({ metrics: many, series: [{ id: "a", values }] });
    expect(parts(container, "pizza-value")).toHaveLength(0);
    expect(slices(container)).toHaveLength(60);
  });

  it("uses the caller's format", () => {
    const { container } = renderChart({ format: (v) => `${v}%` });
    expect(parts(container, "pizza-value")[0]?.textContent).toBe("90%");
  });
});

describe("PizzaChart: labels", () => {
  const labelAt = (container: HTMLElement, i: number) =>
    parts(container, "pizza-label")[i] as Element;

  it("rotates labels along the rim by default and keeps the lower half upright", () => {
    const { container } = renderChart();
    // Four slices: middles at 45°, 135°, 225°, 315°.
    expect(labelAt(container, 0).getAttribute("transform")).toContain("rotate(45)");
    expect(labelAt(container, 1).getAttribute("transform")).toContain("rotate(315)");
  });

  it("supports radial and horizontal labels", () => {
    expect(
      labelAt(renderChart({ labelRotation: "radial" }).container, 0).getAttribute("transform"),
    ).toContain("rotate(-45)");
    expect(
      labelAt(renderChart({ labelRotation: "horizontal" }).container, 0).getAttribute("transform"),
    ).toContain("rotate(0)");
  });

  it("wraps long labels and marks a lower-is-better slice", () => {
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

describe("PizzaChart: readout", () => {
  it("shows every series' value for a focused slice", () => {
    const { container } = renderChart({ series: [winger, fullback] });
    fireEvent.focus(slices(container, "b")[1] as Element);
    const readout = screen.getByRole("tooltip");
    expect(readout.textContent).toContain("Shots");
    expect(readout.textContent).toContain("Winger A60");
    expect(readout.textContent).toContain("Full-back B70");
  });

  it("says lower is better, off scale and no data where they apply", () => {
    const { container } = renderChart({
      series: [{ id: "a", values: { turnovers: 140 } }],
    });
    fireEvent.focus(slices(container)[0] as Element);
    expect(screen.getByRole("tooltip").textContent).toContain("lower is better");
    expect(screen.getByRole("tooltip").textContent).toContain("off scale");
    fireEvent.pointerEnter(parts(container, "pizza-wedge")[0] as Element);
    expect(screen.getByRole("tooltip").textContent).toContain("No data");
  });

  it("follows the pointer into a wedge and clears when a mouse leaves it", () => {
    const { container } = renderChart();
    const wedge = parts(container, "pizza-wedge")[1] as Element;
    fireEvent.pointerEnter(wedge);
    expect(screen.getByRole("tooltip").textContent).toContain("Shots");
    fireEvent.pointerLeave(wedge, { pointerType: "mouse" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("keeps a touch readout until a press outside the chart", () => {
    const { container } = renderChart();
    const wedge = parts(container, "pizza-wedge")[0] as Element;
    fireEvent.pointerDown(wedge, { pointerType: "touch" });
    fireEvent.pointerLeave(wedge, { pointerType: "touch" });
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("rings the focused slice itself, and clears when it loses focus", () => {
    const { container } = renderChart();
    const slice = slices(container)[0] as HTMLElement;
    const stroke = () => (slice.querySelector("path") as SVGElement).style.strokeWidth;
    expect(stroke()).toBe("1");
    fireEvent.focus(slice);
    expect(stroke()).toBe("2.5");
    expect(slice.style.outline).toContain("none");
    fireEvent.blur(slice);
    expect(stroke()).toBe("1");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("PizzaChart: click to detail", () => {
  it("makes nothing clickable without renderDetail", () => {
    const { container } = renderChart();
    expect(slices(container)[0]?.getAttribute("role")).toBeNull();
  });

  it("swaps the chart for the detail view, and Back restores it with focus", () => {
    const renderDetail = vi.fn(() => <p>shot map</p>);
    const { container } = renderChart({ series: [winger, fullback], renderDetail });
    const slice = slices(container, "b")[1] as HTMLElement;
    expect(slice.getAttribute("role")).toBe("button");
    expect(slice.getAttribute("aria-label")).toBe("Shots, Full-back B, 70. Open details");

    fireEvent.click(slice);
    expect(container.querySelector("svg[role=group]")).toBeNull();
    expect(screen.getByText("shot map")).toBeTruthy();
    expect(screen.getByRole("heading").textContent).toBe("Shots");
    expect(screen.getByText("Full-back B 70")).toBeTruthy();
    expect(renderDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        metric: metrics[1],
        series: fullback,
        values: { a: 60, b: 70 },
      }),
    );
    expect(document.activeElement).toBe(screen.getByRole("heading"));

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(container.querySelector("svg[role=group]")).not.toBeNull();
    expect(document.activeElement?.getAttribute("data-pitchkit-metric")).toBe("shots");
    expect(document.activeElement?.getAttribute("data-pitchkit-series")).toBe("b");
  });

  it("opens with Enter or Space and closes with Escape or close()", () => {
    let close = () => {};
    const { container } = renderChart({
      renderDetail: (ctx) => {
        close = ctx.close;
        return <p>detail</p>;
      },
    });
    fireEvent.keyDown(slices(container)[0] as Element, { key: "Enter" });
    expect(screen.getByText("detail")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("heading"), { key: "Escape" });
    expect(screen.queryByText("detail")).toBeNull();

    fireEvent.keyDown(slices(container)[0] as Element, { key: " " });
    expect(screen.getByText("detail")).toBeTruthy();
    act(() => close());
    expect(screen.queryByText("detail")).toBeNull();

    fireEvent.keyDown(slices(container)[0] as Element, { key: "a" });
    expect(screen.queryByText("detail")).toBeNull();
  });

  it("can be controlled", () => {
    const onSelectedChange = vi.fn();
    const { container, rerender } = renderChart({
      renderDetail: () => <p>detail</p>,
      selected: null,
      onSelectedChange,
    });
    fireEvent.click(slices(container)[0] as Element);
    expect(onSelectedChange).toHaveBeenCalledWith({ metricId: "npxg", seriesId: "a" });
    expect(screen.queryByText("detail")).toBeNull();

    rerender(
      <PizzaChart
        metrics={metrics}
        series={[winger]}
        width={500}
        height={500}
        renderDetail={() => <p>detail</p>}
        selected={{ metricId: "npxg", seriesId: "a" }}
        onSelectedChange={onSelectedChange}
      />,
    );
    expect(screen.getByText("detail")).toBeTruthy();
  });

  it("shows the chart for a selection naming an unknown slice", () => {
    const { container } = renderChart({
      renderDetail: () => <p>detail</p>,
      selected: { metricId: "nope", seriesId: "a" },
    });
    expect(container.querySelector("svg[role=group]")).not.toBeNull();
  });

  it("shows a dash in the heading when the opened slice has no value", () => {
    renderChart({
      series: [{ id: "a", label: "Winger A", values: {} }, fullback],
      renderDetail: () => null,
      selected: { metricId: "npxg", seriesId: "a" },
    });
    expect(screen.getByText("Winger A –")).toBeTruthy();
  });
});

describe("PizzaChart: annotations and warnings", () => {
  it("gives children the geometry through usePizzaChart()", () => {
    function Benchmark() {
      const { pointAt, angleOf, outer, inner } = usePizzaChart();
      const point = pointAt("npxg", 100);
      return (
        <circle
          data-testid="mark"
          cx={point?.[0]}
          cy={point?.[1]}
          r={outer - inner}
          data-angle={angleOf("shots")}
          data-missing={String(pointAt("nope", 1))}
        />
      );
    }
    renderChart({ children: <Benchmark /> });
    const mark = screen.getByTestId("mark");
    // Four slices: the first slice's middle is 45° round from the top.
    expect(Number(mark.getAttribute("data-angle"))).toBeCloseTo((3 * Math.PI) / 4);
    expect(Number(mark.getAttribute("cx"))).toBeGreaterThan(250);
    expect(Number(mark.getAttribute("cy"))).toBeLessThan(250);
    expect(mark.getAttribute("data-missing")).toBe("undefined");
  });

  it("throws when usePizzaChart() is used outside a chart", () => {
    function Stray() {
      usePizzaChart();
      return null;
    }
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Stray />)).toThrow("inside <PizzaChart>");
  });

  it("warns in development about too many series for the layout, or too few metrics", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const extra = [winger, fullback, { id: "c", values: {} }];
    renderChart({ series: extra, seriesLayout: "overlay" });
    renderChart({ series: [...extra, { id: "d", values: {} }] });
    renderChart({ metrics: metrics.slice(0, 2) });
    expect(warn).toHaveBeenCalledTimes(3);
    expect(warn.mock.calls[0]?.[0]).toContain("overlaid slices hide each other");
    expect(warn.mock.calls[1]?.[0]).toContain("too thin to read");
  });

  it("does not warn at the limits", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderChart({ series: [winger, fullback], seriesLayout: "overlay" });
    renderChart({ series: [winger, fullback, { id: "c", values: {} }] });
    expect(warn).not.toHaveBeenCalled();
  });
});
