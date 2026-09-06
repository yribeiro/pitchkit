"use client";

import { VerticalPitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

/** Same pitch, vertical orientation — useful for shot maps and attacking-third views. */
export function VerticalPitchBasic() {
  return <VerticalPitch type="statsbomb" appearance={docsAppearance} />;
}
