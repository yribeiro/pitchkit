"use client";

import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import type { StatsBombShot } from "@pitchkit/data-providers/statsbomb";
import { Scatter, VerticalPitch } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

/** Just the fields this chart reads, under StatsBomb's own names. */
type Shot = Pick<StatsBombShot, "x" | "y"> & {
  shot: Pick<StatsBombShot["shot"], "statsbomb_xg" | "outcome">;
};

// StatsBomb coordinates: 120 x 80 yards, origin top-left, y pointing down.
// Outcomes keep StatsBomb's spelling — "Off T", not "off target".
const shots: Shot[] = [
  { x: 111.2, y: 38.4, shot: { statsbomb_xg: 0.71, outcome: { id: 97, name: "Goal" } } },
  { x: 104.6, y: 45.1, shot: { statsbomb_xg: 0.29, outcome: { id: 100, name: "Saved" } } },
  { x: 107.9, y: 32.7, shot: { statsbomb_xg: 0.41, outcome: { id: 97, name: "Goal" } } },
  { x: 98.3, y: 48.2, shot: { statsbomb_xg: 0.11, outcome: { id: 98, name: "Off T" } } },
  { x: 101.7, y: 36.5, shot: { statsbomb_xg: 0.22, outcome: { id: 96, name: "Blocked" } } },
  { x: 94.8, y: 40.3, shot: { statsbomb_xg: 0.07, outcome: { id: 100, name: "Saved" } } },
  { x: 109.5, y: 46.8, shot: { statsbomb_xg: 0.48, outcome: { id: 100, name: "Saved" } } },
  { x: 90.6, y: 28.9, shot: { statsbomb_xg: 0.05, outcome: { id: 98, name: "Off T" } } },
  { x: 103.9, y: 25.6, shot: { statsbomb_xg: 0.15, outcome: { id: 96, name: "Blocked" } } },
  { x: 86.4, y: 43.7, shot: { statsbomb_xg: 0.04, outcome: { id: 98, name: "Off T" } } },
];

const goals = shots.filter((s) => s.shot.outcome.name === "Goal");
const others = shots.filter((s) => s.shot.outcome.name !== "Goal");

/** Marker area proportional to xG, so a 0.7 chance reads as ~10x a 0.07 one. */
const radius = (s: Shot) => 3 + Math.sqrt(s.shot.statsbomb_xg) * 12;

/**
 * A StatsBomb shot map in a light, print-report look. Every colour is a
 * Tailwind class: the `pitch-*` utilities set the pitch's `--pitch-*`
 * variables, and each `<Scatter>` takes ordinary `fill-*`/`stroke-*`
 * utilities. Goals and non-goals are two layers rather than a colour
 * accessor, because a class applies to a whole layer.
 */
export function StylingStatsbombBasic() {
  return (
    <VerticalPitch
      type="statsbomb"
      appearance={docsAppearance}
      crop={cropForHalf(getPitchDimensions("statsbomb"))}
      className="pitch-surface-stone-50 pitch-stripe-stone-100 pitch-lines-stone-400 pitch-line-width-1"
    >
      <Scatter
        data={others}
        x={(s) => s.x}
        y={(s) => s.y}
        r={radius}
        strokeWidth={1.5}
        className="fill-stone-400/30 stroke-stone-500"
      />
      <Scatter
        data={goals}
        x={(s) => s.x}
        y={(s) => s.y}
        r={radius}
        strokeWidth={1.5}
        className="fill-red-600 stroke-white"
      />
    </VerticalPitch>
  );
}
