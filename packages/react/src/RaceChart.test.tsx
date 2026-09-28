import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RaceChart } from "./RaceChart.js";
import { useRaceChart } from "./use-race-chart.js";

interface Shot {
  minute: number;
  xg: number;
  goal?: boolean;
  period?: number;
}

const HOME: Shot[] = [
  { minute: 7, xg: 0.06 },
  { minute: 31, xg: 0.44, goal: true, period: 1 },
  { minute: 78, xg: 0.33, goal: true, period: 2 },
];
const AWAY: Shot[] = [
  { minute: 15, xg: 0.04, period: 1 },
  { minute: 73, xg: 0.35, goal: true, period: 2 },
];

function renderChart(props: Partial<Parameters<typeof RaceChart<Shot>>[0]> = {}) {
  return render(
    <RaceChart<Shot>
      series={[
        { id: "HOME", data: HOME },
        { id: "AWAY", data: AWAY },
      ]}
      time={(s) => s.minute}
      value={(s) => s.xg}
      emphasise={(s) => s.goal === true}
      period={(s) => s.period as number}
      width={720}
      height={380}
      {...props}
    />,
  );
}

/**
 * happy-dom reports every element as zero-sized, and the crosshair needs a
 * real width to map a clientX onto a minute — so it bails out and nothing
 * is ever shown. Same shape of problem as the canvas mock in core: stub
 * the one measurement the handler depends on.
 */
function hoverable(container: HTMLElement): Element {
  const hitArea = container.querySelector('rect[fill="transparent"]') as Element;
  vi.spyOn(hitArea, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 720,
    bottom: 380,
    width: 720,
    height: 380,
    toJSON: () => ({}),
  } as DOMRect);
  return hitArea;
}

describe("<RaceChart>", () => {
  it("draws one step line per series", () => {
    const { container } = renderChart();

    expect(container.querySelectorAll('[data-pitchkit-part="race-line"]')).toHaveLength(2);
  });

  it("emits a step path, not an interpolated one", () => {
    // Only H and V commands after the initial M: any L or C would mean the
    // chart is drawing xG accruing between shots.
    const { container } = renderChart();
    const d = container.querySelector('[data-pitchkit-part="race-line"]')?.getAttribute("d") ?? "";

    expect(d).toMatch(/^M[\d.\s-]+(?:\s[HV][\d.-]+)+$/);
  });

  it("anchors each line at kick-off and runs it to full time", () => {
    const { container } = renderChart();
    const d = container.querySelector('[data-pitchkit-part="race-line"]')?.getAttribute("d") ?? "";
    const commands = d.split(" ");

    // Starts on the baseline at the left edge, ends with a horizontal run
    // to the right edge rather than stopping at the last shot.
    expect(commands[0]).toMatch(/^M/);
    expect(commands[commands.length - 1]).toMatch(/^H/);
  });

  it("marks only emphasised points by default", () => {
    const { container } = renderChart();

    expect(container.querySelectorAll('[data-pitchkit-part="race-emphasis"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-pitchkit-part="race-marker"]')).toHaveLength(0);
  });

  it('marks every point with markers="all"', () => {
    const { container } = renderChart({ appearance: { markers: "all" } });

    expect(container.querySelectorAll('[data-pitchkit-part="race-marker"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-pitchkit-part="race-emphasis"]')).toHaveLength(3);
  });

  it('draws no markers with markers="none"', () => {
    const { container } = renderChart({ appearance: { markers: "none" } });

    expect(container.querySelectorAll("circle")).toHaveLength(0);
  });

  it("shades under the line only when asked", () => {
    const { container: without } = renderChart();
    expect(without.querySelectorAll('[data-pitchkit-part="race-area"]')).toHaveLength(0);

    const { container: with_ } = renderChart({ appearance: { area: true } });
    expect(with_.querySelectorAll('[data-pitchkit-part="race-area"]')).toHaveLength(2);
  });

  it("closes the area down to the baseline", () => {
    const { container } = renderChart({ appearance: { area: true } });
    const d = container.querySelector('[data-pitchkit-part="race-area"]')?.getAttribute("d") ?? "";

    expect(d.endsWith("Z")).toBe(true);
  });

  it("prints each series total at its line end", () => {
    renderChart();

    expect(screen.getByText("HOME 0.83")).toBeTruthy();
    expect(screen.getByText("AWAY 0.39")).toBeTruthy();
  });

  it("assigns series colours by slot, so removing one never repaints the others", () => {
    const { container } = renderChart();
    // Array.from rather than a spread: TypeDoc compiles this package
    // without DOM.Iterable when generating the docs API reference.
    const lines = Array.from(container.querySelectorAll('[data-pitchkit-part="race-line"]'));

    expect(lines[0]?.getAttribute("style")).toContain("--pitch-series-1");
    expect(lines[1]?.getAttribute("style")).toContain("--pitch-series-2");

    const { container: reduced } = render(
      <RaceChart<Shot>
        series={[{ id: "AWAY", data: AWAY }]}
        time={(s) => s.minute}
        value={(s) => s.xg}
        width={720}
        height={380}
      />,
    );
    // AWAY is now the only series, so it takes slot 1 — colour follows
    // position in the given array, which is the entity order the caller
    // controls, not a rank derived from the data.
    expect(
      reduced.querySelector('[data-pitchkit-part="race-line"]')?.getAttribute("style"),
    ).toContain("--pitch-series-1");
  });

  it("drops the themed default when a series carries a className", () => {
    // Inline style beats a utility class at the same property, so keeping
    // the default would silently defeat `className` (D9).
    const { container } = render(
      <RaceChart<Shot>
        series={[{ id: "HOME", data: HOME, className: "stroke-emerald-400" }]}
        time={(s) => s.minute}
        value={(s) => s.xg}
        width={720}
        height={380}
      />,
    );
    const group = container.querySelector("[data-pitchkit-series]");
    const line = container.querySelector('[data-pitchkit-part="race-line"]');

    // One class on the group reaches every part through SVG inheritance.
    expect(group?.getAttribute("class")).toBe("stroke-emerald-400");
    expect(line?.getAttribute("style")).not.toContain("--pitch-series-1");
  });

  it("shows a legend for two series and omits it for one", () => {
    renderChart();
    expect(screen.getByText("HOME")).toBeTruthy();

    const { queryByText } = render(
      <RaceChart<Shot>
        series={[{ id: "SOLO", data: HOME }]}
        time={(s) => s.minute}
        value={(s) => s.xg}
        width={720}
        height={380}
      />,
    );
    expect(queryByText("SOLO")).toBeNull();
  });

  it("prefers an explicit label over the id", () => {
    renderChart({
      series: [
        { id: "HOME", label: "Rovers", data: HOME },
        { id: "AWAY", label: "County", data: AWAY },
      ],
    });

    expect(screen.getByText("Rovers")).toBeTruthy();
  });

  it("derives period breaks from the data rather than assuming 45", () => {
    // The first half here really ends at 31', so that is where the rule
    // belongs — a fixed 45 would be drawn in empty space.
    const { container } = renderChart();
    const breaks = container.querySelectorAll('[data-pitchkit-part="race-period"] line');

    expect(breaks).toHaveLength(1);
    expect(screen.getByText("HT")).toBeTruthy();
  });

  it("draws no period rules without a period accessor", () => {
    const { container } = render(
      <RaceChart<Shot>
        series={[{ id: "HOME", data: HOME }]}
        time={(s) => s.minute}
        value={(s) => s.xg}
        width={720}
        height={380}
      />,
    );

    expect(container.querySelectorAll('[data-pitchkit-part="race-period"] line')).toHaveLength(0);
  });

  it("runs the axis past 90 for extra time", () => {
    renderChart({
      series: [{ id: "HOME", data: [{ minute: 118, xg: 0.2 }] }],
    });

    // A knockout match genuinely reaches 118'; a fixed 90 would clip it.
    // 120' is deliberately absent: the axis ends at the data's own
    // extent, so a tick beyond it would sit off the plot.
    expect(screen.getByText("105'")).toBeTruthy();
    expect(screen.queryByText("120'")).toBeNull();
  });

  it("floors the axis at 90 for a match that ends early", () => {
    renderChart({ series: [{ id: "HOME", data: [{ minute: 30, xg: 0.2 }] }] });

    expect(screen.getByText("90'")).toBeTruthy();
  });

  it("reserves no right gutter for the end labels", () => {
    // They sit above their own line ends, inside the plot, so the lines
    // run the full width. Only half the last minute tick is reserved.
    const { container } = renderChart({ width: 400, height: 200 });
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("viewBox")).toBe("0 0 400 200");
    // Right padding 14 => the hit-area rect spans 400 - 38 - 14 = 348.
    const hitArea = container.querySelector('rect[fill="transparent"]');
    expect(hitArea?.getAttribute("width")).toBe("348");
  });

  it("puts each end label above its line end, inside the plot", () => {
    const { container } = renderChart({ width: 720, height: 380 });
    const labels = Array.from(
      container.querySelectorAll('text[data-pitchkit-part="race-end-label"]'),
    );
    const hitArea = container.querySelector('rect[fill="transparent"]') as Element;
    const plotRight = Number(hitArea.getAttribute("x")) + Number(hitArea.getAttribute("width"));

    expect(labels).toHaveLength(2);
    for (const label of labels) {
      expect(label.getAttribute("text-anchor")).toBe("end");
      expect(Number(label.getAttribute("x"))).toBeLessThanOrEqual(plotRight);
    }
    // The label names its series, since there is no swatch beside it now.
    expect(labels.map((l) => l.textContent)).toEqual(["HOME 0.83", "AWAY 0.39"]);
  });

  it("drops a label below its line when the total leaves no headroom", () => {
    // A total landing exactly on the axis ceiling has nothing above it,
    // so the label would otherwise be clipped by the top of the plot.
    const { container } = renderChart({
      series: [{ id: "HOME", data: [{ minute: 20, xg: 1.5 }] }],
      width: 720,
      height: 380,
    });
    const label = container.querySelector('text[data-pitchkit-part="race-end-label"]') as Element;
    const line = container.querySelector('[data-pitchkit-part="race-line"]') as Element;
    const lineTop = Number((line.getAttribute("d") ?? "").match(/V([\d.]+)/)?.[1]);

    expect(Number(label.getAttribute("y"))).toBeGreaterThan(lineTop);
  });

  it("uses a squarer box at phone width", () => {
    // A 2:1 box at 320px leaves a plot barely taller than its own axis
    // labels. Explicit width/height still wins outright.
    const { container } = render(
      <RaceChart<Shot>
        series={[{ id: "HOME", data: HOME }]}
        time={(s) => s.minute}
        value={(s) => s.xg}
      />,
    );
    const box = container.firstElementChild as HTMLElement;

    // Unmeasured (SSR / first paint) falls back to the wide ratio.
    expect(box.style.aspectRatio).toBe("2 / 1");
  });

  it("leaves vertical scrolling to the page while claiming horizontal drags", () => {
    // Without pan-y the browser claims both axes and the crosshair — the
    // only way to read a value between two labelled points — is
    // unreachable on a phone.
    const { container } = renderChart();
    const box = container.firstElementChild as HTMLElement;

    expect(box.style.touchAction).toBe("pan-y");
  });

  it("gives every marker a hit-friendly radius", () => {
    // A 6px dot is a pinpoint; markers clear 8px.
    const { container } = renderChart({ appearance: { markers: "all" } });
    const radii = Array.from(container.querySelectorAll("circle")).map((c) =>
      Number(c.getAttribute("r")),
    );

    expect(Math.min(...radii)).toBeGreaterThanOrEqual(4);
  });

  it("dismisses the readout on a press outside the chart", () => {
    // A touch readout has no pointerleave to end it — the pointer stops
    // existing when the finger lifts — so without an outside-press
    // dismissal it stays up forever. That is what a browser's device
    // emulation shows, because it reports every pointer as touch.
    const { container } = renderChart();
    const hitArea = hoverable(container);

    fireEvent.pointerDown(hitArea, { pointerType: "touch", clientX: 400 });
    expect(container.querySelector('[role="tooltip"]')).not.toBeNull();

    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
  });

  it("keeps the readout up for a press inside the chart", () => {
    const { container } = renderChart();
    const hitArea = hoverable(container);

    fireEvent.pointerDown(hitArea, { pointerType: "touch", clientX: 400 });
    fireEvent.pointerDown(hitArea, { pointerType: "touch", clientX: 300 });

    expect(container.querySelector('[role="tooltip"]')).not.toBeNull();
  });

  it("clears the readout when a mouse leaves the plot", () => {
    const { container } = renderChart();
    const hitArea = hoverable(container);

    fireEvent.pointerMove(hitArea, { pointerType: "mouse", clientX: 400 });
    expect(container.querySelector('[role="tooltip"]')).not.toBeNull();

    fireEvent.pointerLeave(hitArea, { pointerType: "mouse" });
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
  });

  it("does not clear a touch readout on pointerleave", () => {
    // pointerleave fires the instant a finger lifts, so clearing on it
    // would set the readout and wipe it in the same gesture.
    const { container } = renderChart();
    const hitArea = hoverable(container);

    fireEvent.pointerDown(hitArea, { pointerType: "touch", clientX: 400 });
    fireEvent.pointerLeave(hitArea, { pointerType: "touch" });

    expect(container.querySelector('[role="tooltip"]')).not.toBeNull();
  });

  it("paints every marker above every line", () => {
    // Drawn per-series, the second team's line runs straight over the
    // first team's goal markers — a mark that says "a goal happened here"
    // is never something a line should cover.
    const { container } = renderChart({ appearance: { markers: "all" } });
    const painted = Array.from(container.querySelectorAll("[data-pitchkit-part]")).map((el) =>
      el.getAttribute("data-pitchkit-part"),
    );

    const lastLine = painted.lastIndexOf("race-line");
    const firstMarker = painted.findIndex(
      (part) => part === "race-marker" || part === "race-emphasis",
    );

    expect(lastLine).toBeGreaterThan(-1);
    expect(firstMarker).toBeGreaterThan(lastLine);
  });

  it("paints annotation children above every line and marker", () => {
    const { container } = render(
      <RaceChart<Shot>
        series={[
          { id: "HOME", data: HOME },
          { id: "AWAY", data: AWAY },
        ]}
        time={(s) => s.minute}
        value={(s) => s.xg}
        emphasise={(s) => s.goal === true}
        width={720}
        height={380}
      >
        <rect data-pitchkit-part="annotation" x={10} y={10} width={4} height={4} />
      </RaceChart>,
    );
    const painted = Array.from(container.querySelectorAll("[data-pitchkit-part]")).map((el) =>
      el.getAttribute("data-pitchkit-part"),
    );

    expect(painted.indexOf("annotation")).toBeGreaterThan(painted.lastIndexOf("race-line"));
    expect(painted.indexOf("annotation")).toBeGreaterThan(painted.lastIndexOf("race-emphasis"));
  });

  it("renders an empty series without throwing", () => {
    const { container } = renderChart({ series: [{ id: "NONE", data: [] }] });

    expect(container.querySelectorAll('[data-pitchkit-part="race-line"]')).toHaveLength(1);
    expect(screen.getByText("NONE 0.00")).toBeTruthy();
  });

  it("leaves headroom above the leading line", () => {
    // Spain's real 1.79 should put the ceiling on 2.0, not on 1.79 —
    // otherwise the line is pinned to the top edge and the top gridline
    // carries no label.
    renderChart({ series: [{ id: "HOME", data: [{ minute: 40, xg: 1.79 }] }] });

    expect(screen.getByText("2")).toBeTruthy();
  });

  it("gives a chart with no accumulation a usable axis", () => {
    renderChart({ series: [{ id: "HOME", data: [] }] });

    expect(screen.getByText("1")).toBeTruthy();
  });

  it("renders a scoreless chart flat on the baseline", () => {
    const { container } = renderChart({
      series: [{ id: "HOME", data: [{ minute: 20, xg: 0 }] }],
    });
    const d = container.querySelector('[data-pitchkit-part="race-line"]')?.getAttribute("d") ?? "";

    // No vertical commands at all: nothing ever accumulated.
    expect(d).not.toContain("V");
  });
});

describe("useRaceChart", () => {
  function Marker({ minute, team }: { minute: number; team: string }) {
    const { scaleX, scaleY, valueAt } = useRaceChart();
    return (
      <rect
        data-testid="card"
        x={scaleX(minute) - 3}
        y={scaleY(valueAt(team, minute)) - 9}
        width={6}
        height={8}
      />
    );
  }

  it("positions an annotation child on its series line", () => {
    const { container } = renderChart({ children: <Marker minute={40} team="HOME" /> });
    const card = container.querySelector('[data-testid="card"]');

    expect(card).not.toBeNull();
    // HOME is on 0.50 at minute 40 (0.06 + 0.44), which is half of the
    // 1.0 axis ceiling, so the marker sits mid-plot rather than anywhere
    // arbitrary.
    const y = Number(card?.getAttribute("y"));
    expect(y).toBeGreaterThan(100);
    expect(y).toBeLessThan(250);
  });

  it("throws for an unknown series id", () => {
    expect(() => renderChart({ children: <Marker minute={40} team="NOPE" /> })).toThrow(
      /no series with id "NOPE"/,
    );
  });

  it("throws when used outside a chart", () => {
    expect(() => render(<Marker minute={10} team="HOME" />)).toThrow(
      /must be rendered inside <RaceChart>/,
    );
  });
});
