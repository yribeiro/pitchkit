import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "@pitchkit/core";
import type { PitchTypeId } from "@pitchkit/core";
import { Annotate } from "./Annotate.js";
import { Arrows } from "./Arrows.js";
import { Heatmap } from "./Heatmap.js";
import { Pitch } from "./Pitch.js";
import { MomentumChart } from "./MomentumChart.js";
import { RaceChart } from "./RaceChart.js";
import { PizzaChart } from "./PizzaChart.js";
import { RadarChart } from "./RadarChart.js";
import { Scatter } from "./Scatter.js";

/**
 * The whole point of re-emitting JSX rather than reusing core's DOM
 * painters (the architectural call this package made over "render into a
 * ref"): React's server renderer can turn this tree into a string, which
 * core's `renderSceneToSVGElement` fundamentally cannot do — it calls
 * `document.createElementNS` and needs a live DOM.
 */
describe("SSR (renderToString)", () => {
  it("renders a Pitch with pitch markings and a Scatter layer to a string", () => {
    const html = renderToString(
      <Pitch type="statsbomb" width={600} height={400}>
        <Scatter data={[{ x: 60, y: 40 }]} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    expect(html).toContain("<svg");
    expect(html).toContain('viewBox="0 0 600 400"');
    expect(html).toContain('data-pitchkit-part="outline"');
    expect(html).toContain('data-pitchkit-mark="scatter"');
  });

  it("renders Annotate and Arrows layers to a string", () => {
    const html = renderToString(
      <Pitch type="uefa" width={500} height={350}>
        <Arrows
          data={[{ x: 10, y: 10, x2: 40, y2: 30 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          x2={(d) => d.x2}
          y2={(d) => d.y2}
        />
        <Annotate
          data={[{ x: 10, y: 10, name: "A" }]}
          x={(d) => d.x}
          y={(d) => d.y}
          label={(d) => d.name}
        />
      </Pitch>,
    );

    expect(html).toContain('data-pitchkit-mark="arrow-shaft"');
    expect(html).toContain('data-pitchkit-mark="annotate"');
    expect(html).toContain(">A<");
  });

  it("does not throw for the responsive (no explicit width/height) case", () => {
    expect(() => renderToString(<Pitch type="opta" />)).not.toThrow();
  });

  it("renders a Heatmap's <canvas> element (structure only — painting is client-only)", () => {
    const html = renderToString(
      <Pitch type="statsbomb" width={600} height={400}>
        <Heatmap data={[{ x: 10, y: 10 }]} x={(d) => d.x} y={(d) => d.y} />
      </Pitch>,
    );

    expect(html).toContain("<canvas");
    expect(html).toContain("<foreignObject");
  });

  it("every registered pitch type renders without throwing", () => {
    for (const type of Object.keys(PITCH_DIMENSIONS) as PitchTypeId[]) {
      expect(() => renderToString(<Pitch type={type} width={400} height={300} />)).not.toThrow();
    }
  });

  it("renders a RaceChart to a string", () => {
    // <RaceChart> is a root in its own right, not a Pitch layer, so it
    // has its own way to fail at SSR — it measures its container. The
    // nominal-size fallback is what keeps the server render complete
    // rather than empty, and nothing but a test holds that in place.
    const html = renderToString(
      <RaceChart
        series={[
          { id: "ESP", data: [{ minute: 31, period: 1, xg: 0.44, goal: true }] },
          { id: "ENG", data: [{ minute: 73, period: 2, xg: 0.35 }] },
        ]}
        time={(s) => s.minute}
        period={(s) => s.period}
        value={(s) => s.xg}
        emphasise={(s) => s.goal === true}
        width={720}
        height={380}
      />,
    );

    expect(html).toContain("<svg");
    expect(html).toContain('viewBox="0 0 720 380"');
    expect(html).toContain('data-pitchkit-layer="race"');
    expect(html).toContain('data-pitchkit-part="race-line"');
    // The step itself made it into the markup, not just the frame.
    expect(html).toMatch(/d="M[\d.]+ [\d.]+ H/);
  });

  it("renders a RaceChart at its responsive fallback size without a DOM", () => {
    const html = renderToString(
      <RaceChart
        series={[{ id: "ESP", data: [{ minute: 31, period: 1, xg: 0.44 }] }]}
        time={(s) => s.minute}
        period={(s) => s.period}
        value={(s) => s.xg}
      />,
    );

    expect(html).toContain('viewBox="0 0 720 360"');
    expect(html).toContain('data-pitchkit-part="race-line"');
  });

  it("renders a MomentumChart to a string, events included", () => {
    const html = renderToString(
      <MomentumChart
        data={[
          { minute: 0, period: 1, v: 2 },
          { minute: 7, period: 1, v: -4 },
          { minute: 45, period: 2, v: 1 },
        ]}
        time={(d) => d.minute}
        period={(d) => d.period}
        value={(d) => d.v}
        events={[{ minute: 12, period: 1, side: "home" as const, kind: "goal" as const }]}
        eventTime={(e) => e.minute}
        eventPeriod={(e) => e.period}
        eventSide={(e) => e.side}
        eventKind={(e) => e.kind}
        width={720}
        height={240}
      />,
    );

    expect(html).toContain('viewBox="0 0 720 240"');
    expect(html).toContain('data-pitchkit-layer="momentum"');
    expect(html).toContain('data-pitchkit-part="momentum-bar"');
    expect(html).toContain('data-pitchkit-part="momentum-event"');
  });

  it("renders a MomentumChart at its responsive fallback size without a DOM", () => {
    const html = renderToString(
      <MomentumChart
        data={[{ minute: 0, period: 1, v: 1 }]}
        time={(d) => d.minute}
        period={(d) => d.period}
        value={(d) => d.v}
      />,
    );

    expect(html).toContain('viewBox="0 0 720 240"');
  });

  it("renders a RadarChart to a string, at its fallback size without a DOM", () => {
    const html = renderToString(
      <RadarChart
        metrics={[{ id: "a" }, { id: "b" }, { id: "c", lowerIsBetter: true }]}
        series={[{ id: "p", values: { a: 40, b: 60, c: 20 } }]}
        renderDetail={() => null}
      />,
    );

    expect(html).toContain('viewBox="0 0 720 720"');
    expect(html).toContain('data-pitchkit-layer="radar"');
    expect(html).toContain('data-pitchkit-part="radar-shape"');
    expect(html).toContain('role="button"');
  });

  it("renders a PizzaChart to a string, at its fallback size without a DOM", () => {
    const html = renderToString(
      <PizzaChart
        metrics={[{ id: "a", group: "G" }, { id: "b", group: "G" }, { id: "c" }]}
        series={[{ id: "p", values: { a: 40, b: 60, c: 20 } }]}
        renderDetail={() => null}
      />,
    );

    expect(html).toContain('viewBox="0 0 720 720"');
    expect(html).toContain('data-pitchkit-layer="pizza"');
    expect(html).toContain('data-pitchkit-part="pizza-slice"');
    expect(html).toContain('role="button"');
  });
});
