"use client";

import { PlayerAvatar, VerticalPitch } from "@pitchkit/react";
import type { PlayerCard, PlayerSubstitution } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

interface Player {
  number: number;
  name: string;
  x: number;
  y: number;
  card?: PlayerCard;
  subbed?: PlayerSubstitution;
  goals?: number;
  assists?: number;
}

// A 4-3-3 in StatsBomb coordinates (120 x 80), attacking upwards.
const lineup: Player[] = [
  { number: 1, name: "Bono", x: 8, y: 40 },
  { number: 3, name: "N. Mazraoui", x: 28, y: 70 },
  { number: 25, name: "R. Halhal", x: 22, y: 50, card: "yellow" },
  { number: 14, name: "I. Diop", x: 22, y: 30, subbed: "off" },
  { number: 2, name: "A. Hakimi", x: 28, y: 10, card: "yellow", assists: 1 },
  { number: 24, name: "N. El Aynaoui", x: 50, y: 55 },
  { number: 6, name: "A. Bouaddi", x: 46, y: 40, subbed: "off" },
  { number: 8, name: "A. Ounahi", x: 58, y: 25, card: "yellow", subbed: "off", goals: 2 },
  { number: 23, name: "B. E. Khannouss", x: 82, y: 68, card: "yellow", subbed: "off" },
  { number: 11, name: "I. Saibari", x: 96, y: 40, subbed: "off" },
  { number: 10, name: "B. Díaz", x: 82, y: 12, assists: 2 },
];

/** `<PlayerAvatar>` puts a photo, number, name and match events at each player's position. */
export function PlayerAvatarBasic() {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <VerticalPitch type="statsbomb" appearance={docsAppearance}>
        {lineup.map((p) => (
          <PlayerAvatar
            key={p.number}
            x={p.x}
            y={p.y}
            name={p.name}
            number={p.number}
            card={p.card}
            subbed={p.subbed}
            goals={p.goals}
            assists={p.assists}
          />
        ))}
      </VerticalPitch>
    </div>
  );
}
