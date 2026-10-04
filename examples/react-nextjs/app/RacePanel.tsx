"use client";

import { useState } from "react";
import { RaceChart, useRaceChart } from "@pitchkit/react";
import { AWAY_TEAM, FINAL_CARDS, FINAL_SHOTS, HOME_TEAM } from "./final-2024-data";
import type { FinalCard, FinalShot } from "./final-2024-data";

/**
 * A booking is not a series — nothing about it accumulates — so it rides
 * the annotation slot instead. `valueAt` is what puts it *on* the team's
 * line rather than floating beside it: Stones' 52' yellow sits at whatever
 * England's cumulative xG was at 52'.
 */
function Cards({ cards }: { cards: FinalCard[] }) {
  const { scaleX, scaleY, valueAt } = useRaceChart();

  return (
    <g data-pitchkit-part="race-card">
      {cards.map((card) => (
        <rect
          key={`${card.team}-${card.minute}`}
          x={scaleX(card.minute, card.period) - 3}
          y={scaleY(valueAt(card.team, card.minute, card.period)) - 10}
          width={6}
          height={8}
          rx={1}
          // The surface ring is what keeps it legible where it crosses
          // the line it is anchored to.
          style={{
            fill: "var(--pitch-card-yellow, #eab308)",
            stroke: "var(--pitch-chart-surface)",
            strokeWidth: 1.5,
          }}
        >
          <title>{`${card.player} booked, ${card.minute}'`}</title>
        </rect>
      ))}
    </g>
  );
}

const toggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  fontSize: "0.8rem",
  color: "#bbb",
} as const;

/**
 * `<RaceChart>` is a sibling of `<Pitch>`, not a layer inside one, so
 * this panel has no pitch in it at all — which is the point worth
 * verifying here. It still has to server-render like everything else;
 * view source to confirm the step paths are in the initial HTML.
 */
export function RacePanel() {
  const [area, setArea] = useState(false);
  const [markers, setMarkers] = useState<"emphasis" | "all">("emphasis");
  const [showCards, setShowCards] = useState(true);

  const series = [HOME_TEAM, AWAY_TEAM].map((team) => ({
    id: team,
    data: FINAL_SHOTS.filter((s) => s.team === team),
  }));

  return (
    <section>
      <h2>xG race — Spain 2–1 England, Euro 2024 final</h2>
      <p className="panel-note">
        Real StatsBomb open data. Spain finish on 1.79 xG from 16 shots, England on 0.73 from 9 —
        and England&apos;s goal came off a 0.0379 xG shot. Shootouts are period 5 and carry xG, so a
        knockout match would need <code>period &lt;= 4</code> filtering; this one went to 90.
      </p>

      <div className="race-controls">
        <label style={toggleStyle}>
          <input type="checkbox" checked={area} onChange={(e) => setArea(e.target.checked)} />
          Shade under the line
        </label>
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={markers === "all"}
            onChange={(e) => setMarkers(e.target.checked ? "all" : "emphasis")}
          />
          Mark every shot
        </label>
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={showCards}
            onChange={(e) => setShowCards(e.target.checked)}
          />
          Bookings (annotation slot)
        </label>
      </div>

      <div className="race-stage">
        <RaceChart<FinalShot>
          series={series}
          time={(s) => s.minute + s.second / 60}
          value={(s) => s.xg}
          emphasise={(s) => s.goal}
          period={(s) => s.period}
          appearance={{ area, markers }}
        >
          {showCards && <Cards cards={FINAL_CARDS} />}
        </RaceChart>
      </div>

      <p className="panel-note">
        Hover or tap anywhere on the plot: the crosshair reports both teams at that minute, which is
        what a race chart is for and what a per-mark tooltip cannot do. On a touch screen a
        horizontal drag scrubs it and a vertical one still scrolls the page.
      </p>
    </section>
  );
}
