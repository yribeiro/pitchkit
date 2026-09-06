"use client";

import { Pitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

/**
 * The pitch background (outline/stripes/lines) isn't a mark — it's
 * restyled only via `--pitch-surface`/`--pitch-stripe`/`--pitch-lines`.
 * `pitch-surface-*`/`pitch-stripe-*`/`pitch-lines-*` are custom Tailwind
 * utilities (an installable `@utility ... --value(--color-*)` recipe, see
 * the Configuration > Tailwind page) that turn those variables into
 * first-class classes reading any color already in the project's theme.
 */
export function TailwindRecipeBasic() {
  return (
    <Pitch
      type="statsbomb"
      appearance={docsAppearance}
      className="pitch-surface-emerald-950 pitch-stripe-emerald-800 pitch-lines-amber-500"
    />
  );
}
