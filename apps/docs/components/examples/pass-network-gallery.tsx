"use client";

import { Annotate, Arrows, Pitch, Scatter } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

// StatsBomb coordinates (120 x 80). Average positions plus pass counts
// between player pairs — the classic pass-network recipe, built from the
// Scatter + Arrows + Annotate primitives.
const players = [
  { id: "GK", x: 10, y: 40, touches: 42 },
  { id: "LB", x: 32, y: 12, touches: 58 },
  { id: "LCB", x: 26, y: 30, touches: 71 },
  { id: "RCB", x: 26, y: 50, touches: 66 },
  { id: "RB", x: 32, y: 68, touches: 49 },
  { id: "DM", x: 44, y: 40, touches: 88 },
  { id: "LCM", x: 58, y: 24, touches: 74 },
  { id: "RCM", x: 58, y: 56, touches: 69 },
  { id: "LW", x: 82, y: 14, touches: 46 },
  { id: "ST", x: 92, y: 40, touches: 38 },
  { id: "RW", x: 82, y: 66, touches: 44 },
];

const byId = Object.fromEntries(players.map((p) => [p.id, p]));

/** Every pass endpoint below references a player id from the list above. */
function node(id: string) {
  const player = byId[id];
  if (!player) throw new Error(`Unknown player id: ${id}`);
  return player;
}

const passes = [
  { from: "GK", to: "LCB", count: 18 },
  { from: "GK", to: "RCB", count: 15 },
  { from: "LCB", to: "LB", count: 21 },
  { from: "RCB", to: "RB", count: 17 },
  { from: "LCB", to: "DM", count: 24 },
  { from: "RCB", to: "DM", count: 19 },
  { from: "DM", to: "LCM", count: 26 },
  { from: "DM", to: "RCM", count: 22 },
  { from: "LB", to: "LCM", count: 14 },
  { from: "RB", to: "RCM", count: 12 },
  { from: "LCM", to: "LW", count: 16 },
  { from: "RCM", to: "RW", count: 13 },
  { from: "LCM", to: "ST", count: 9 },
  { from: "RCM", to: "ST", count: 8 },
  { from: "LW", to: "ST", count: 7 },
  { from: "RW", to: "ST", count: 6 },
];

/**
 * A pass network: node size = touches, edge width = passes between the
 * pair. Aggregation is plain data prep — the pitch just draws it.
 */
export function PassNetworkGallery() {
  return (
    <Pitch type="statsbomb" appearance={docsAppearance}>
      <Arrows
        data={passes}
        x={(p) => node(p.from).x}
        y={(p) => node(p.from).y}
        x2={(p) => node(p.to).x}
        y2={(p) => node(p.to).y}
        strokeWidth={(p) => 0.5 + p.count / 6}
        strokeOpacity={(p) => 0.3 + Math.min(p.count / 30, 0.6)}
        headSize={0}
        tooltip={(p) => `${p.from} → ${p.to}: ${p.count} passes`}
      />
      <Scatter
        data={players}
        x={(p) => p.x}
        y={(p) => p.y}
        r={(p) => 4 + p.touches / 12}
        stroke="white"
        strokeWidth={1.5}
        tooltip={(p) => `${p.id} · ${p.touches} touches`}
      />
      <Annotate
        data={players}
        x={(p) => p.x}
        y={(p) => p.y}
        label={(p) => p.id}
        offsetY={-14}
      />
    </Pitch>
  );
}
