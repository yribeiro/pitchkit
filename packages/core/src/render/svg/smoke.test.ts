import { describe, expect, it } from "vitest";
import { PITCH_DIMENSIONS } from "../../dimensions/registry.js";
import type { PitchTypeId } from "../../dimensions/types.js";
import type { Scene } from "../../scene/types.js";
import type { Orientation } from "../../transform/types.js";
import { displayUnitScale } from "../../transform/canonical.js";
import { renderSceneToSVGElement } from "./render-scene.js";

// From the registry, so a new provider is smoke-tested without anyone
// remembering to add it here.
const PITCH_TYPES = Object.keys(PITCH_DIMENSIONS) as PitchTypeId[];
const ORIENTATIONS: Orientation[] = ["horizontal", "vertical"];
const VIEWPORT = { width: 600, height: 400 };

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

function buildScene(pitchType: PitchTypeId, orientation: Orientation): Scene {
  return {
    dimensions: PITCH_DIMENSIONS[pitchType],
    viewport: { ...VIEWPORT, orientation },
    layers: [],
  };
}

function numbersFromAttr<T extends readonly string[]>(
  el: Element,
  ...attrs: T
): { [K in keyof T]: number } {
  return attrs.map((attr) => Number(el.getAttribute(attr))) as { [K in keyof T]: number };
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Reads back the bounding box of an SVG primitive from its own attributes. */
function elementBoundingBox(el: Element): BoundingBox {
  if (el.tagName === "rect") {
    const [x, y, width, height] = numbersFromAttr(el, "x", "y", "width", "height");
    return { minX: x, minY: y, maxX: x + width, maxY: y + height };
  }
  if (el.tagName === "line") {
    const [x1, y1, x2, y2] = numbersFromAttr(el, "x1", "y1", "x2", "y2");
    return {
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
    };
  }
  if (el.tagName === "circle") {
    const [cx, cy, r] = numbersFromAttr(el, "cx", "cy", "r");
    return { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r };
  }
  // path: "M startX startY A rx ry 0 0 sweep endX endY" — only the
  // endpoints are needed for a (slightly conservative, but sufficient)
  // bounding box, since our arcs always sweep less than 180 degrees.
  const d = el.getAttribute("d") ?? "";
  const numbers = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const [startX, startY, , , , , , endX, endY] = numbers;
  return {
    minX: Math.min(startX, endX),
    minY: Math.min(startY, endY),
    maxX: Math.max(startX, endX),
    maxY: Math.max(startY, endY),
  };
}

describe("SVG renderer smoke test", () => {
  for (const pitchType of PITCH_TYPES) {
    for (const orientation of ORIENTATIONS) {
      it(`${pitchType} (${orientation}): renders a structurally correct pitch`, () => {
        const scene = buildScene(pitchType, orientation);
        const svg = renderSceneToSVGElement(scene);

        for (const [part, expectedCount] of Object.entries(PARTS_WITH_EXPECTED_COUNT)) {
          const elements = svg.querySelectorAll(`[data-pitchkit-part="${part}"]`);
          expect(elements.length, `expected ${expectedCount} "${part}" element(s)`).toBe(
            expectedCount,
          );
        }

        const outline = svg.querySelector('[data-pitchkit-part="outline"]');
        if (!outline) {
          throw new Error("missing outline element");
        }
        const outlineBox = elementBoundingBox(outline);
        const outlineWidth = outlineBox.maxX - outlineBox.minX;
        const outlineHeight = outlineBox.maxY - outlineBox.minY;

        // Uniform scale must never distort the pitch: the rendered
        // outline's aspect ratio should equal the pitch's true
        // length:width ratio (swapped for vertical orientation),
        // regardless of the viewport's own aspect ratio. "True" means the
        // display extent, not the grid — on a percentage grid those differ,
        // because 100 units of x is 105 m while 100 units of y is 68 m.
        const dims = PITCH_DIMENSIONS[pitchType];
        const [unitScaleX, unitScaleY] = displayUnitScale(dims);
        const displayLength = dims.length * unitScaleX;
        const displayWidth = dims.width * unitScaleY;
        const expectedPitchAspect =
          orientation === "vertical"
            ? displayWidth / displayLength
            : displayLength / displayWidth;
        expect(outlineWidth / outlineHeight).toBeCloseTo(expectedPitchAspect, 2);

        // Strongest end-to-end signal: every marking falls within the
        // outline's bounding box (composes dimensions + transform +
        // geometry + renderer in one check).
        const epsilon = 0.5; // pixel rounding tolerance
        svg.querySelectorAll("[data-pitchkit-part]").forEach((el) => {
          if (el === outline) return;
          const box = elementBoundingBox(el);
          expect(box.minX).toBeGreaterThanOrEqual(outlineBox.minX - epsilon);
          expect(box.minY).toBeGreaterThanOrEqual(outlineBox.minY - epsilon);
          expect(box.maxX).toBeLessThanOrEqual(outlineBox.maxX + epsilon);
          expect(box.maxY).toBeLessThanOrEqual(outlineBox.maxY + epsilon);
        });

        expect(svg.outerHTML).toMatchSnapshot();
      });
    }
  }
});
