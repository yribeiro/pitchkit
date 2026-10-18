"use client";

import { GoalShots, GoalView, useGoalView } from "@pitchkit/react";

// England 1-1 Switzerland at Euro 2024, the shootout England won 5-3, in
// kick order. StatsBomb open data, match 3942227: each kick's
// `end_location[1]` and `[2]`, in yards. Akanji's was saved.
const kicks = [
  { player: "Palmer", team: "England", scored: true, y: 37.3, z: 1.1 },
  { player: "Akanji", team: "Switzerland", scored: false, y: 42.0, z: 0.2 },
  { player: "Bellingham", team: "England", scored: true, y: 43.4, z: 0.3 },
  { player: "Schär", team: "Switzerland", scored: true, y: 42.6, z: 0.3 },
  { player: "Saka", team: "England", scored: true, y: 43.8, z: 0.2 },
  { player: "Shaqiri", team: "Switzerland", scored: true, y: 43.8, z: 0.9 },
  { player: "Toney", team: "England", scored: true, y: 37.3, z: 0.2 },
  { player: "Amdouni", team: "Switzerland", scored: true, y: 39.7, z: 0.2 },
  { player: "Alexander-Arnold", team: "England", scored: true, y: 36.9, z: 1.6 },
];

const RADIUS = 9;
const teamColor = (team: string) =>
  team === "England" ? "var(--pitch-marker-primary)" : "var(--pitch-marker-goal)";

/** The kick order, printed on each kick through the view's own mapping. */
function KickOrder() {
  const { toPixel } = useGoalView();
  return (
    <g pointerEvents="none">
      {kicks.map((kick, i) => {
        const point = toPixel(kick.y, kick.z, RADIUS);
        if (!point) return null;
        return (
          <text
            key={kick.player}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight={600}
            fill={kick.scored ? "white" : teamColor(kick.team)}
          >
            {i + 1}
          </text>
        );
      })}
    </g>
  );
}

/**
 * Every penalty of a shootout where it crossed the line, numbered in kick
 * order. England went into both corners; Switzerland's first three all
 * went to the shooter's right. The saved kick is hollow.
 */
export function PenaltyShootoutGallery() {
  return (
    <GoalView type="statsbomb">
      <GoalShots
        data={kicks}
        y={(kick) => kick.y}
        z={(kick) => kick.z}
        r={RADIUS}
        fill={(kick) => (kick.scored ? teamColor(kick.team) : "var(--pitch-goal-backdrop)")}
        stroke={(kick) => (kick.scored ? "var(--pitch-goal-backdrop)" : teamColor(kick.team))}
        strokeWidth={(kick) => (kick.scored ? 1.5 : 2)}
        tooltip={(kick) => `${kick.player} (${kick.team}) — ${kick.scored ? "scored" : "saved"}`}
      />
      <KickOrder />
    </GoalView>
  );
}
