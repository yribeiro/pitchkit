"use client";

import { Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

/**
 * `--pitch-line-width` gets the same recipe shape as the color utilities,
 * but validates a bare/arbitrary number instead of looking one up in the
 * theme — Tailwind has no rich preset scale for stroke width to borrow
 * from the way it does for color.
 */
export function TailwindLineWidthBasic() {
  return (
    <Pitch
      type="statsbomb"
      appearance={docsAppearance}
      className="pitch-line-width-4 pitch-lines-amber-600 pitch-surface-black pitch-stripe-gray-800"
    />
  );
}
