import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Annotate } from "./Annotate.js";
import { Arrows } from "./Arrows.js";
import { Heatmap } from "./Heatmap.js";
import { Pitch } from "./Pitch.js";
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

  it("all 3 pitch types render without throwing", () => {
    for (const type of ["statsbomb", "opta", "uefa"] as const) {
      expect(() => renderToString(<Pitch type={type} width={400} height={300} />)).not.toThrow();
    }
  });
});
