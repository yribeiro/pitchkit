"use client";

import { useState } from "react";
import { MomentumChart } from "@pitchkit/react";
import { FINAL_EVENTS, FIRST_HALF, SECOND_HALF } from "./momentum-final-data";

const toggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  fontSize: "0.8rem",
  color: "#bbb",
} as const;

const periods = [
  FIRST_HALF.map((value, i) => ({ minute: i, value })),
  SECOND_HALF.map((value, i) => ({ minute: 45 + i, value })),
];

/**
 * `<MomentumChart>` is a sibling of `<Pitch>`, like `<RaceChart>`: no pitch,
 * no `type` prop, and it still server-renders, so view source to confirm the
 * bars are in the initial HTML.
 */
export function MomentumPanel() {
  const [substitutions, setSubstitutions] = useState(true);

  const events = FINAL_EVENTS.filter((e) => substitutions || e.kind !== "substitution");

  return (
    <section>
      <h2>Match momentum — Spain 2–1 England, Euro 2024 final</h2>
      <p className="panel-note">
        Derived from StatsBomb open data, not a StatsBomb metric: attacking-third on-ball events per
        minute, Spain minus England, smoothed over three minutes. Each bar runs to the next sample,
        and the halves are sized by their minutes, so the first half is wider than 45 because it ran
        to 47&apos;.
      </p>

      <div className="race-controls">
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={substitutions}
            onChange={(e) => setSubstitutions(e.target.checked)}
          />
          Substitutions (crowds the icon row; check it on a phone width)
        </label>
      </div>

      <div className="race-stage">
        <MomentumChart
          periods={periods}
          time={(d) => d.minute}
          value={(d) => d.value}
          teams={{ home: "Spain", away: "England" }}
          events={events}
          eventTime={(e) => e.minute}
          eventSide={(e) => e.side}
          eventKind={(e) => e.kind}
        />
      </div>

      <p className="panel-note">
        Hover or tap a half for the readout. Icons that would touch stack with an offset rather than
        adding rows.
      </p>
    </section>
  );
}
