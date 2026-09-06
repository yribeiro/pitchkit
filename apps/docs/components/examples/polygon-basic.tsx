"use client";

import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { Polygon, VerticalPitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). A single highlighted zone in the
// attacking half — the half this example crops to.
const zones = [
  {
    vertices: [
      [80, 18],
      [120, 18],
      [120, 62],
      [80, 62],
    ] as const,
  },
];

const dimensions = getPitchDimensions("statsbomb");

/**
 * `<Polygon>` draws an arbitrary closed shape — good for highlighting zones.
 * Shown here cropped to the attacking half (`cropForHalf`) and rotated
 * vertical (`<VerticalPitch>`), the usual framing for a single-zone or
 * shot-map style view.
 */
export function PolygonBasic() {
  return (
    <VerticalPitch type="statsbomb" appearance={docsAppearance} crop={cropForHalf(dimensions)}>
      <Polygon data={zones} points={(z) => z.vertices} />
    </VerticalPitch>
  );
}
