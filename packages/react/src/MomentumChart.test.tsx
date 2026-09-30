import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MomentumChart } from "./MomentumChart.js";
import { colorSaysTeam, iconColor, kindLabel } from "./momentum-icons.js";
import { useMomentumChart } from "./use-momentum-chart.js";
import type { MomentumEventKind, MomentumSide } from "./momentum-types.js";

interface Sample {
  minute: number;
  value: number;
}
interface Incident {
  minute: number;
  side: MomentumSide;
  kind: MomentumEventKind;
  note?: string;
}

/** One sample a minute from `start` to `end`, each worth `value`. */
function period(start: number, end: number, value: (minute: number) => number): Sample[] {
  const samples: Sample[] = [];
  for (let minute = start; minute < end; minute += 1)
    samples.push({ minute, value: value(minute) });
  return samples;
}

const FIRST = period(0, 45, (m) => (m % 2 === 0 ? 4 : -2));
const SECOND = period(45, 90, (m) => (m % 2 === 0 ? 3 : -5));

type Props = Partial<Parameters<typeof MomentumChart<Sample, Incident>>[0]>;

function renderChart(props: Props = {}) {
  return render(
    <MomentumChart<Sample, Incident>
      periods={[FIRST, SECOND]}
      time={(s) => s.minute}
      value={(s) => s.value}
      teams={{ home: "Roma", away: "Barcelona" }}
      width={720}
      height={240}
      {...(props as object)}
    />,
  );
}

const parts = (container: HTMLElement, part: string) =>
  Array.from(container.querySelectorAll(`[data-pitchkit-part="${part}"]`));

/** happy-dom reports every element as zero-sized; stub the one measurement the readout needs. */
function hoverable(container: HTMLElement): Element {
  const hitArea = container.querySelector('rect[fill="transparent"]') as Element;
  vi.spyOn(hitArea, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 700,
    bottom: 200,
    width: 700,
    height: 200,
    toJSON: () => ({}),
  } as DOMRect);
  return hitArea;
}

describe("<MomentumChart>", () => {
  it("draws one panel per period", () => {
    const { container } = renderChart();

    expect(parts(container, "momentum-panel")).toHaveLength(2);
  });

  it("draws one bar per sample", () => {
    const { container } = renderChart();

    expect(parts(container, "momentum-bar")).toHaveLength(FIRST.length + SECOND.length);
  });

  it("grows the home side's bars up from the zero line and the away side's down", () => {
    const { container } = renderChart();
    const zero = Number(parts(container, "momentum-zero")[0]?.getAttribute("y1"));
    const bars = parts(container, "momentum-bar");
    const home = bars.find((b) => b.getAttribute("data-pitchkit-side") === "home") as Element;
    const away = bars.find((b) => b.getAttribute("data-pitchkit-side") === "away") as Element;

    // SVG y grows downward: a home bar ends on the zero line, an away bar starts on it.
    expect(Number(home.getAttribute("y")) + Number(home.getAttribute("height"))).toBeCloseTo(
      zero,
      5,
    );
    expect(Number(away.getAttribute("y"))).toBeCloseTo(zero, 5);
  });

  it("scales bars against one symmetric axis, so equal pressure looks equal", () => {
    const { container } = renderChart({
      periods: [
        [
          { minute: 0, value: 6 },
          { minute: 1, value: -6 },
        ],
      ],
    });
    const [up, down] = parts(container, "momentum-bar");

    expect(up?.getAttribute("height")).toBe(down?.getAttribute("height"));
  });

  it("colours bars by side from the series variables", () => {
    const { container } = renderChart();
    const bars = parts(container, "momentum-bar");
    const style = (side: string) =>
      bars.find((b) => b.getAttribute("data-pitchkit-side") === side)?.getAttribute("style") ?? "";

    expect(style("home")).toContain("--pitch-series-1");
    expect(style("away")).toContain("--pitch-series-2");
  });

  it("never lets a nonzero bar vanish into the zero line", () => {
    const { container } = renderChart({
      periods: [
        [
          { minute: 0, value: 0.0001 },
          { minute: 1, value: 100 },
        ],
      ],
    });
    const tiny = parts(container, "momentum-bar")[0] as Element;

    expect(Number(tiny.getAttribute("height"))).toBeGreaterThanOrEqual(1);
  });

  it("draws a level sample as no bar height at all", () => {
    const { container } = renderChart({
      periods: [
        [
          { minute: 0, value: 0 },
          { minute: 1, value: 5 },
        ],
      ],
    });

    expect(Number(parts(container, "momentum-bar")[0]?.getAttribute("height"))).toBe(0);
  });

  it("draws samples at arbitrary intervals at their true widths", () => {
    // One-minute samples, then a five-minute one: the last bar is wider, and
    // neither overlaps nor leaves a gap.
    const { container } = renderChart({
      periods: [
        [
          { minute: 0, value: 1 },
          { minute: 1, value: 1 },
          { minute: 2, value: 1 },
          { minute: 7, value: 1 },
        ],
      ],
    });
    const widths = parts(container, "momentum-bar").map((b) => Number(b.getAttribute("width")));

    expect(widths[2]).toBeGreaterThan(widths[0] as number);
  });

  it("widens a half to fit its stoppage time", () => {
    // A second half running to 94' is wider than a first ending on 45', in
    // proportion, so a minute is the same width in both.
    const { container } = renderChart({ periods: [FIRST, period(45, 94, () => 1)] });
    const [first, second] = parts(container, "momentum-panel").map((p) =>
      Number(p.querySelector("rect")?.getAttribute("width")),
    );

    expect((second as number) / (first as number)).toBeCloseTo(49 / 45, 1);
  });

  it("lets periodRanges override a period's extent", () => {
    const { container } = renderChart({ periodRanges: [{ end: 60 }] });
    const [first, second] = parts(container, "momentum-panel").map((p) =>
      Number(p.querySelector("rect")?.getAttribute("width")),
    );

    expect(first as number).toBeGreaterThan(second as number);
  });

  it("supports extra time as further periods", () => {
    const { container } = renderChart({
      periods: [FIRST, SECOND, period(90, 105, () => 2), period(105, 120, () => -2)],
    });

    expect(parts(container, "momentum-panel")).toHaveLength(4);
  });

  it("lets maxValue pin the axis", () => {
    const small = renderChart({ maxValue: 100 });
    const pinned = Number(parts(small.container, "momentum-bar")[0]?.getAttribute("height"));
    const auto = renderChart();
    const natural = Number(parts(auto.container, "momentum-bar")[0]?.getAttribute("height"));

    expect(pinned).toBeLessThan(natural);
  });

  it("renders with no data without throwing", () => {
    const { container } = renderChart({ periods: [[], []] });

    expect(parts(container, "momentum-panel")).toHaveLength(2);
    expect(parts(container, "momentum-bar")).toHaveLength(0);
  });

  it("renders a chart of all zeros", () => {
    const { container } = renderChart({ periods: [period(0, 10, () => 0)] });

    expect(parts(container, "momentum-bar").every((b) => b.getAttribute("height") === "0")).toBe(
      true,
    );
  });

  describe("legend and axis", () => {
    it("names both sides when teams are given", () => {
      renderChart();

      expect(screen.getByText("Roma")).toBeTruthy();
      expect(screen.getByText("Barcelona")).toBeTruthy();
    });

    it("draws no legend without teams, or when turned off", () => {
      const without = renderChart({ teams: undefined });
      expect(parts(without.container, "momentum-legend")).toHaveLength(0);

      const off = renderChart({ appearance: { legend: false } });
      expect(parts(off.container, "momentum-legend")).toHaveLength(0);
    });

    it("ticks each period's minutes", () => {
      renderChart();

      expect(screen.getByText("15'")).toBeTruthy();
      expect(screen.getByText("75'")).toBeTruthy();
    });

    it("draws the boundary minute once, not at both ends of the gap", () => {
      const { container } = renderChart();
      const labels = parts(container, "momentum-label").map((l) => l.textContent);

      expect(labels.filter((l) => l === "45'")).toHaveLength(1);
    });

    it("omits the ticks when the axis is off", () => {
      const { container } = renderChart({ appearance: { axis: false } });

      expect(parts(container, "momentum-label")).toHaveLength(0);
    });
  });

  describe("events", () => {
    const INCIDENTS: Incident[] = [
      { minute: 12, side: "home", kind: "goal" },
      { minute: 30, side: "away", kind: "yellow-card" },
      { minute: 70, side: "away", kind: "red-card" },
    ];
    const eventProps = {
      events: INCIDENTS,
      eventTime: (e: Incident) => e.minute,
      eventSide: (e: Incident) => e.side,
      eventKind: (e: Incident) => e.kind,
    };

    it("draws an icon per event, tagged with its kind and side", () => {
      const { container } = renderChart(eventProps);
      const icons = parts(container, "momentum-event");

      expect(icons.map((i) => i.getAttribute("data-pitchkit-kind"))).toEqual([
        "goal",
        "yellow-card",
        "red-card",
      ]);
      expect(icons.map((i) => i.getAttribute("data-pitchkit-side"))).toEqual([
        "home",
        "away",
        "away",
      ]);
    });

    it("draws no events strip when there are none", () => {
      const { container } = renderChart();

      expect(parts(container, "momentum-event")).toHaveLength(0);
    });

    it("underlines only the icons whose own colour can't say the team", () => {
      const { container } = renderChart(eventProps);
      const underlined = (kind: string) =>
        container.querySelectorAll(`[data-pitchkit-kind="${kind}"] > rect`).length;

      expect(underlined("goal")).toBe(0);
      expect(underlined("yellow-card")).toBe(1);
      expect(underlined("red-card")).toBe(1);
    });

    it("places an event at its minute, in the right period", () => {
      const { container } = renderChart(eventProps);
      const x = (kind: string) =>
        Number(
          container
            .querySelector(`[data-pitchkit-kind="${kind}"] g[transform]`)
            ?.getAttribute("transform")
            ?.match(/translate\(([\d.]+)/)?.[1],
        );
      const panels = parts(container, "momentum-panel");
      const secondStart = Number(panels[1]?.querySelector("rect")?.getAttribute("x"));

      expect(x("goal")).toBeLessThan(secondStart);
      expect(x("red-card")).toBeGreaterThan(secondStart);
    });

    it("pins an event in the gap between periods to the nearest one", () => {
      const { container } = renderChart({
        ...eventProps,
        events: [{ minute: 200, side: "home", kind: "goal" }],
      });
      const icon = container.querySelector('[data-pitchkit-kind="goal"] g[transform]');

      expect(icon?.getAttribute("transform")).toContain("translate(");
    });

    it("names an event for screen readers, from its label or its kind", () => {
      const { container } = renderChart({
        ...eventProps,
        eventLabel: (e: Incident) => e.note ?? "",
        events: [{ minute: 12, side: "home", kind: "goal", note: "Dybala 12'" }],
      });

      expect(container.querySelector("title")?.textContent).toContain("Dybala 12'");

      const plain = renderChart(eventProps);
      expect(plain.container.querySelector("title")?.textContent).toBe("Goal, 12'");
    });

    it("draws every kind of icon", () => {
      const kinds: MomentumEventKind[] = [
        "goal",
        "own-goal",
        "missed-penalty",
        "yellow-card",
        "red-card",
        "substitution",
        "var",
      ];
      const { container } = renderChart({
        ...eventProps,
        events: kinds.map((kind, i) => ({ minute: 5 + i * 10, side: "home" as const, kind })),
      });

      expect(parts(container, "momentum-event")).toHaveLength(kinds.length);
    });

    it("stacks crowded events in one row, each offset from the last", () => {
      const crowd = Array.from({ length: 4 }, () => ({
        minute: 60,
        side: "home" as const,
        kind: "substitution" as const,
      }));
      const { container } = renderChart({ ...eventProps, events: crowd });
      const at = parts(container, "momentum-event").map((e) =>
        e
          .querySelector("g[transform]")
          ?.getAttribute("transform")
          ?.match(/translate\(([\d.]+) ([\d.]+)/)
          ?.slice(1, 3)
          .map(Number),
      ) as number[][];

      expect(new Set(at.map(([, y]) => y)).size).toBe(1);
      const xs = at.map(([x]) => x as number).sort((a, b) => a - b);
      expect(new Set(xs).size).toBe(4);
      expect(xs[1]! - xs[0]!).toBeGreaterThan(0);
    });
  });

  describe("readout", () => {
    function hoverAt(container: HTMLElement, clientX: number, pointerType = "mouse") {
      const hit = hoverable(container);
      fireEvent.pointerMove(hit, { pointerType, clientX });
      return hit;
    }

    it("shows the minute and whose pressure it is", () => {
      const { container } = renderChart();
      // clientX 173 lands mid-way through the first period, at about 22'.
      hoverAt(container, 173);

      const tooltip = container.querySelector('[role="tooltip"]') as Element;
      expect(tooltip.textContent).toMatch(/2[12]'/);
      expect(tooltip.textContent).toMatch(/Roma|Barcelona/);
    });

    it("says nothing is there in a stretch with no data", () => {
      const { container } = renderChart({
        periods: [[{ minute: 0, value: 4 }], SECOND],
        periodRanges: [{ end: 45 }],
      });
      hoverAt(container, 173);

      expect(container.querySelector('[role="tooltip"]')?.textContent).toContain("No data");
    });

    it("says level for a zero sample", () => {
      const { container } = renderChart({ periods: [period(0, 45, () => 0), SECOND] });
      hoverAt(container, 173);

      expect(container.querySelector('[role="tooltip"]')?.textContent).toContain("Level");
    });

    it("lists the events at that minute", () => {
      const { container } = renderChart({
        events: [{ minute: 22, side: "away", kind: "red-card" }],
        eventTime: (e: Incident) => e.minute,
        eventSide: (e: Incident) => e.side,
        eventKind: (e: Incident) => e.kind,
      });
      hoverAt(container, 173);

      expect(container.querySelector('[role="tooltip"]')?.textContent).toContain("Red card");
    });

    it("falls back to Home and Away without team names", () => {
      const { container } = renderChart({ teams: undefined });
      hoverAt(container, 173);

      expect(container.querySelector('[role="tooltip"]')?.textContent).toMatch(/Home|Away/);
    });

    it("hands a custom readout the datum behind the bar", () => {
      const seen: Array<Sample | undefined> = [];
      const { container } = renderChart({
        tooltip: (hover) => {
          seen.push(hover.datum);
          return <span>{`custom ${hover.period}`}</span>;
        },
      });
      hoverAt(container, 173);

      expect(container.querySelector('[role="tooltip"]')?.textContent).toBe("custom 0");
      expect(seen.at(-1)?.minute).toBeGreaterThanOrEqual(21);
    });

    it("draws the crosshair where the pointer is", () => {
      const { container } = renderChart();
      hoverAt(container, 173);

      expect(parts(container, "momentum-crosshair")).toHaveLength(1);
    });

    it("reads the second period in its own minutes", () => {
      const { container } = renderChart();
      // Well into the right-hand panel: about 67'.
      hoverAt(container, 520);

      expect(container.querySelector('[role="tooltip"]')?.textContent).toMatch(/6[5-9]'/);
    });

    it("shows nothing in the gap between periods", () => {
      const { container } = renderChart();
      // The gap is x 356..364, which is clientX 346..354.
      hoverAt(container, 350);

      expect(container.querySelector('[role="tooltip"]')).toBeNull();
    });

    it("clears when a mouse leaves the plot", () => {
      const { container } = renderChart();
      const hit = hoverAt(container, 173);
      fireEvent.pointerLeave(hit, { pointerType: "mouse" });

      expect(container.querySelector('[role="tooltip"]')).toBeNull();
    });

    it("does not clear a touch readout on pointerleave", () => {
      // pointerleave fires the instant a finger lifts, so clearing on it
      // would set the readout and wipe it in the same gesture.
      const { container } = renderChart();
      const hit = hoverable(container);
      fireEvent.pointerDown(hit, { pointerType: "touch", clientX: 173 });
      fireEvent.pointerLeave(hit, { pointerType: "touch" });

      expect(container.querySelector('[role="tooltip"]')).not.toBeNull();
    });

    it("dismisses a touch readout on a press outside the chart", () => {
      const { container } = renderChart();
      const hit = hoverable(container);
      fireEvent.pointerDown(hit, { pointerType: "touch", clientX: 173 });
      expect(container.querySelector('[role="tooltip"]')).not.toBeNull();

      fireEvent.pointerDown(document.body, { pointerType: "touch" });
      expect(container.querySelector('[role="tooltip"]')).toBeNull();
    });

    it("clears on a cancelled gesture", () => {
      const { container } = renderChart();
      const hit = hoverAt(container, 173, "touch");
      fireEvent.pointerCancel(hit);

      expect(container.querySelector('[role="tooltip"]')).toBeNull();
    });

    it("leaves vertical scrolling to the page", () => {
      const { container } = renderChart();

      expect((container.firstElementChild as HTMLElement).style.touchAction).toBe("pan-y");
    });
  });

  describe("sizing", () => {
    it("fills its container at a 3:1 box before it has been measured", () => {
      const { container } = render(
        <MomentumChart<Sample>
          periods={[FIRST, SECOND]}
          time={(s) => s.minute}
          value={(s) => s.value}
        />,
      );

      expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe("3 / 1");
    });

    it("uses a taller box at phone width, and an explicit ratio wins", () => {
      const narrow = render(
        <MomentumChart<Sample>
          periods={[FIRST, SECOND]}
          time={(s) => s.minute}
          value={(s) => s.value}
          width={340}
          height={190}
        />,
      );
      expect(narrow.container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 340 190");

      const explicit = render(
        <MomentumChart<Sample>
          periods={[FIRST, SECOND]}
          time={(s) => s.minute}
          value={(s) => s.value}
          aspectRatio={2}
        />,
      );
      expect((explicit.container.firstElementChild as HTMLElement).style.aspectRatio).toBe("2 / 1");
    });

    it("honours explicit padding", () => {
      const { container } = renderChart({ padding: { top: 5, right: 5, bottom: 5, left: 5 } });
      const hit = container.querySelector('rect[fill="transparent"]');

      expect(hit?.getAttribute("x")).toBe("5");
      expect(hit?.getAttribute("width")).toBe("710");
    });
  });

  describe("annotations", () => {
    function Marker({ minute }: { minute: number }) {
      const { scaleX, scaleY } = useMomentumChart();
      return <circle data-testid="m" cx={scaleX(minute)} cy={scaleY(0)} r={3} />;
    }

    it("positions a child on the period that holds its minute", () => {
      const { container } = render(
        <MomentumChart<Sample>
          periods={[FIRST, SECOND]}
          time={(s) => s.minute}
          value={(s) => s.value}
          width={720}
          height={240}
        >
          <Marker minute={10} />
          <Marker minute={80} />
        </MomentumChart>,
      );
      const [early, late] = Array.from(container.querySelectorAll('[data-testid="m"]')).map((c) =>
        Number(c.getAttribute("cx")),
      );

      expect(early).toBeLessThan(360);
      expect(late).toBeGreaterThan(364);
    });

    it("sends a minute outside every period to the nearest one", () => {
      const { container } = render(
        <MomentumChart<Sample>
          periods={[FIRST, SECOND]}
          time={(s) => s.minute}
          value={(s) => s.value}
          width={720}
          height={240}
        >
          <Marker minute={-20} />
          <Marker minute={300} />
        </MomentumChart>,
      );
      const [before, after] = Array.from(container.querySelectorAll('[data-testid="m"]')).map((c) =>
        Number(c.getAttribute("cx")),
      );

      expect(before).toBeCloseTo(10, 5);
      expect(after).toBeCloseTo(710, 5);
    });

    it("throws outside a chart", () => {
      expect(() => render(<Marker minute={5} />)).toThrow(
        /must be rendered inside <MomentumChart>/,
      );
    });

    it("paints children above the bars and the events", () => {
      const { container } = render(
        <MomentumChart<Sample, Incident>
          periods={[FIRST, SECOND]}
          time={(s) => s.minute}
          value={(s) => s.value}
          events={[{ minute: 10, side: "home", kind: "goal" }]}
          eventTime={(e) => e.minute}
          eventSide={(e) => e.side}
          eventKind={(e) => e.kind}
          width={720}
          height={240}
        >
          <rect data-pitchkit-part="annotation" width={2} height={2} />
        </MomentumChart>,
      );
      const painted = Array.from(container.querySelectorAll("[data-pitchkit-part]")).map((e) =>
        e.getAttribute("data-pitchkit-part"),
      );

      expect(painted.indexOf("annotation")).toBeGreaterThan(painted.lastIndexOf("momentum-bar"));
      expect(painted.indexOf("annotation")).toBeGreaterThan(painted.lastIndexOf("momentum-event"));
    });
  });
});

describe("icon colour rules", () => {
  it("colours a goal, a penalty and a substitution by their team", () => {
    // Asserted on the rule rather than the rendered style: happy-dom's CSS
    // parser drops `color: var(...)`, so the attribute never reaches the DOM
    // there, though a real browser renders it.
    expect(iconColor("goal", "home")).toContain("--pitch-series-1");
    expect(iconColor("goal", "away")).toContain("--pitch-series-2");
    expect(iconColor("substitution", "away")).toContain("--pitch-series-2");
    expect(iconColor("missed-penalty", "home")).toContain("--pitch-series-1");
    expect(iconColor("var", "home")).toContain("--pitch-series-1");
  });

  it("colours a card by its meaning, whoever was booked", () => {
    expect(iconColor("yellow-card", "home")).toContain("--pitch-card-yellow");
    expect(iconColor("yellow-card", "away")).toContain("--pitch-card-yellow");
    expect(iconColor("red-card", "home")).toContain("--pitch-card-red");
  });

  it("draws an own goal in the card red, since it went the wrong way", () => {
    expect(iconColor("own-goal", "home")).toContain("--pitch-card-red");
  });

  it("says which kinds need the team said another way", () => {
    expect(colorSaysTeam("goal")).toBe(true);
    expect(colorSaysTeam("substitution")).toBe(true);
    expect(colorSaysTeam("yellow-card")).toBe(false);
    expect(colorSaysTeam("red-card")).toBe(false);
    expect(colorSaysTeam("own-goal")).toBe(false);
  });

  it("names every kind", () => {
    expect(kindLabel("goal")).toBe("Goal");
    expect(kindLabel("own-goal")).toBe("Own goal");
    expect(kindLabel("missed-penalty")).toBe("Missed penalty");
    expect(kindLabel("yellow-card")).toBe("Yellow card");
    expect(kindLabel("red-card")).toBe("Red card");
    expect(kindLabel("substitution")).toBe("Substitution");
    expect(kindLabel("var")).toBe("VAR");
  });
});
