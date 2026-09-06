"use client";

import { Pitch, Scatter, Voronoi } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

type Team = "home" | "away";

interface Player {
  name: string;
  team: Team;
  x: number;
  y: number;
}

// StatsBomb coordinates (120 x 80). Two opposing back lines, so cells read
// as which team controls which space rather than one undifferentiated mesh.
const players: Player[] = [
  { name: "LB", team: "home", x: 40, y: 15 },
  { name: "CB", team: "home", x: 35, y: 35 },
  { name: "CB", team: "home", x: 35, y: 55 },
  { name: "RB", team: "home", x: 40, y: 70 },
  { name: "LB", team: "away", x: 80, y: 15 },
  { name: "CB", team: "away", x: 85, y: 35 },
  { name: "CB", team: "away", x: 85, y: 55 },
  { name: "RB", team: "away", x: 80, y: 70 },
];

const TEAM_COLOR: Record<Team, string> = { home: "#3b82f6", away: "#f97316" };

/**
 * `<Voronoi>` tessellates space by nearest player. `fill` accepts a
 * per-datum accessor, so opposing teams can be colored differently — here
 * by `p.team` — the same way any other per-datum visual prop works.
 */
export function VoronoiBasic() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Voronoi
        data={players}
        x={(p) => p.x}
        y={(p) => p.y}
        fill={(p) => TEAM_COLOR[p.team]}
        tooltip={(p) => `${p.team} ${p.name}`}
      />
      <Scatter data={players} x={(p) => p.x} y={(p) => p.y} r={4} stroke="white" strokeWidth={1.5} />
    </Pitch>
  );
}
