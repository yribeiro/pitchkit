"use client";

import { Arrows, Pitch, Scatter } from "@pitchkit/react";
import type { PitchAppearance } from "@pitchkit/core";

interface Player {
  name: string;
  x: number;
  y: number;
}

// StatsBomb coordinates (120 x 80).
const players: Player[] = [
  { name: "GK", x: 20, y: 40 },
  { name: "LB", x: 35, y: 15 },
  { name: "RB", x: 35, y: 65 },
  { name: "CB", x: 35, y: 40 },
  { name: "CM", x: 60, y: 40 },
  { name: "FW", x: 90, y: 25 },
];

const passes = [
  { from: players[0], to: players[3] },
  { from: players[3], to: players[1] },
  { from: players[3], to: players[2] },
  { from: players[1], to: players[4] },
  { from: players[4], to: players[5] },
].filter((p): p is { from: Player; to: Player } => p.from !== undefined && p.to !== undefined);

interface LineupPanelProps {
  appearance: PitchAppearance;
}

/**
 * "use client": every @pitchkit/react layer takes accessor *functions*
 * (x, y, tooltip, ...) as props. Functions can't cross the RSC
 * server->client boundary as props, so this tree can't be composed from a
 * Server Component parent passing them in — it has to originate inside a
 * Client Component itself. It's still rendered to real HTML on the server
 * as part of Next's SSR pass (that's what "use client" server-renders
 * then hydrates" means); it just can't be a *child* of the page's server
 * render with function props flowing across that specific boundary.
 * `appearance` itself is plain serializable data, so it's fine to lift
 * into the shared Controls parent and pass down.
 */
export function LineupPanel({ appearance }: LineupPanelProps) {
  return (
    <section>
      <h2>Pitch + Scatter + Arrows</h2>
      <p>Static lineup, server-rendered to HTML (view page source) then hydrated.</p>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <Pitch type="statsbomb" appearance={appearance}>
          <Arrows
            data={passes}
            x={(p) => p.from.x}
            y={(p) => p.from.y}
            x2={(p) => p.to.x}
            y2={(p) => p.to.y}
            strokeOpacity={0.5}
          />
          <Scatter
            data={players}
            x={(p) => p.x}
            y={(p) => p.y}
            r={7}
            stroke="white"
            strokeWidth={2}
            tooltip={(p) => p.name}
          />
        </Pitch>
      </div>
    </section>
  );
}
