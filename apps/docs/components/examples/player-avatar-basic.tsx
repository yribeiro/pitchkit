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

// A 4-3-3 in StatsBomb coordinates (120 x 80): on a vertical pitch x runs top to
// bottom, so the keeper at x 112 is drawn at the foot, the side attacks upwards, and
// y 70 (Hakimi, the right-back) is on the right.
const lineup: Player[] = [
  { number: 1, name: "Bono", x: 112, y: 40 },
  { number: 3, name: "N. Mazraoui", x: 92, y: 10 },
  { number: 25, name: "R. Halhal", x: 98, y: 30, card: "yellow" },
  { number: 14, name: "I. Diop", x: 98, y: 50, subbed: "off" },
  { number: 2, name: "A. Hakimi", x: 92, y: 70, card: "yellow", assists: 1 },
  { number: 24, name: "N. El Aynaoui", x: 70, y: 25 },
  { number: 6, name: "A. Bouaddi", x: 74, y: 40, subbed: "off" },
  { number: 8, name: "A. Ounahi", x: 62, y: 55, card: "yellow", subbed: "off", goals: 2 },
  { number: 23, name: "B. E. Khannouss", x: 38, y: 12, card: "yellow", subbed: "off" },
  { number: 11, name: "I. Saibari", x: 24, y: 40, subbed: "off" },
  { number: 10, name: "B. Díaz", x: 38, y: 68, assists: 2 },
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
