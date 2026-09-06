"use client";

import { Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

/** Bare pitch, no marks — responsive by default (fills its container). */
export function PitchBasic() {
  return <Pitch type="statsbomb" appearance={docsAppearance} />;
}
