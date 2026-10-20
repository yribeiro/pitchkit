"use client";

import { PlayerAvatar, VerticalPitch } from "@pitchkit/react";
import type { PlayerCard, PlayerSubstitution } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

interface Player {
  number: number;
  name: string;
  photo: string;
  x: number;
  y: number;
  card?: PlayerCard;
  subbed?: PlayerSubstitution;
  goals?: number;
  assists?: number;
}

// A fictional XI: the names are invented and the photos are AI-generated faces of
// people who don't exist, served from the docs site's own /players folder.
//
// A 4-3-3 in StatsBomb coordinates (120 x 80): on a vertical pitch x runs top to
// bottom, so the keeper at x 112 is drawn at the foot, the side attacks upwards, and
// y 70 (the right-back) is on the right.
const lineup: Player[] = [
  { number: 1, name: "J. Marlow", photo: "marlow", x: 112, y: 40 },
  { number: 3, name: "T. Brennick", photo: "brennick", x: 92, y: 10 },
  { number: 25, name: "S. Okonkwo-Hale", photo: "okonkwo-hale", x: 98, y: 30, card: "yellow" },
  { number: 14, name: "D. Varela-Ruiz", photo: "varela-ruiz", x: 98, y: 50, subbed: "off" },
  { number: 2, name: "E. Lindqvist", photo: "lindqvist", x: 92, y: 70, card: "yellow", assists: 1 },
  { number: 24, name: "A. Mbeki-Soto", photo: "mbeki-soto", x: 70, y: 25 },
  { number: 6, name: "R. Tanaka-Holm", photo: "tanaka-holm", x: 74, y: 40, subbed: "off" },
  {
    number: 8,
    name: "L. Delacroix",
    photo: "delacroix",
    x: 62,
    y: 55,
    card: "yellow",
    subbed: "off",
    goals: 2,
  },
  {
    number: 23,
    name: "N. Haddad-Kerr",
    photo: "haddad-kerr",
    x: 38,
    y: 12,
    card: "yellow",
    subbed: "off",
  },
  { number: 11, name: "F. Ostrander", photo: "ostrander", x: 24, y: 40, subbed: "off" },
  { number: 10, name: "M. Quintero-Bell", photo: "quintero-bell", x: 38, y: 68, assists: 2 },
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
            src={`/players/${p.photo}.webp`}
          />
        ))}
      </VerticalPitch>
    </div>
  );
}
