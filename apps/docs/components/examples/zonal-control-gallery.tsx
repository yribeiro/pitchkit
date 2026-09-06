"use client";

import { Pitch, Scatter, Voronoi } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

type Team = "home" | "away";

interface Player {
  id: string;
  team: Team;
  x: number;
  y: number;
}

// StatsBomb coordinates (120 x 80). Both full XIs at one frame of play.
const players: Player[] = [
  { id: "GK", team: "home", x: 8, y: 40 },
  { id: "LB", team: "home", x: 35, y: 12 },
  { id: "LCB", team: "home", x: 28, y: 31 },
  { id: "RCB", team: "home", x: 28, y: 49 },
  { id: "RB", team: "home", x: 35, y: 68 },
  { id: "DM", team: "home", x: 44, y: 40 },
  { id: "LCM", team: "home", x: 55, y: 25 },
  { id: "RCM", team: "home", x: 55, y: 55 },
  { id: "LW", team: "home", x: 74, y: 14 },
  { id: "ST", team: "home", x: 80, y: 40 },
  { id: "RW", team: "home", x: 74, y: 66 },
  { id: "GK", team: "away", x: 114, y: 40 },
  { id: "LB", team: "away", x: 90, y: 70 },
  { id: "LCB", team: "away", x: 96, y: 51 },
  { id: "RCB", team: "away", x: 96, y: 29 },
  { id: "RB", team: "away", x: 90, y: 10 },
  { id: "DM", team: "away", x: 82, y: 40 },
  { id: "LCM", team: "away", x: 70, y: 52 },
  { id: "RCM", team: "away", x: 70, y: 28 },
  { id: "LW", team: "away", x: 56, y: 65 },
  { id: "ST", team: "away", x: 50, y: 40 },
  { id: "RW", team: "away", x: 56, y: 15 },
];

const TEAM_COLOR: Record<Team, string> = { home: "#38bdf8", away: "#fb923c" };

/**
 * Zonal control: a Voronoi tessellation over all 22 players, cells colored
 * by team — who controls which patch of grass if the ball dropped there.
 */
export function ZonalControlGallery() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Voronoi
        data={players}
        x={(p) => p.x}
        y={(p) => p.y}
        fill={(p) => TEAM_COLOR[p.team]}
        fillOpacity={0.16}
        stroke="rgba(255, 255, 255, 0.4)"
        tooltip={(p) => `${p.team} ${p.id}`}
      />
      <Scatter
        data={players}
        x={(p) => p.x}
        y={(p) => p.y}
        r={3.5}
        fill={(p) => TEAM_COLOR[p.team]}
        stroke="white"
        strokeWidth={1}
      />
    </Pitch>
  );
}
