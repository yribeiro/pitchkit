"use client";

import { useState } from "react";
import { PlayerAvatar, VerticalPitch } from "@pitchkit/react";
import type { PlayerCard, PlayerSubstitution } from "@pitchkit/react";
import { docsAppearance } from "./docs-appearance";

interface Player {
  number: number;
  name: string;
  photo: string;
  card?: PlayerCard;
  subbed?: PlayerSubstitution;
  goals?: number;
  assists?: number;
}

// The same fictional XI as the first example: invented names, and AI-generated
// faces of people who don't exist.
const squad: Player[] = [
  { number: 1, name: "J. Marlow", photo: "marlow" },
  { number: 3, name: "T. Brennick", photo: "brennick" },
  { number: 25, name: "S. Okonkwo-Hale", photo: "okonkwo-hale", card: "yellow" },
  { number: 14, name: "D. Varela-Ruiz", photo: "varela-ruiz", subbed: "off" },
  { number: 2, name: "E. Lindqvist", photo: "lindqvist", card: "yellow", assists: 1 },
  { number: 24, name: "A. Mbeki-Soto", photo: "mbeki-soto" },
  { number: 6, name: "R. Tanaka-Holm", photo: "tanaka-holm", subbed: "off" },
  { number: 8, name: "L. Delacroix", photo: "delacroix", card: "yellow", goals: 2 },
  { number: 23, name: "N. Haddad-Kerr", photo: "haddad-kerr", subbed: "off" },
  { number: 11, name: "F. Ostrander", photo: "ostrander", subbed: "on" },
  { number: 10, name: "M. Quintero-Bell", photo: "quintero-bell", assists: 2 },
];

// Each formation places every shirt number, in StatsBomb coordinates (120 x 80).
// On a vertical pitch x runs top to bottom, so the keeper at x 112 is at the
// foot and the side attacks upwards; y 0 is the left touchline.
type Spot = readonly [x: number, y: number];

const formations: { name: string; spots: Record<number, Spot> }[] = [
  {
    name: "4-4-2",
    spots: {
      1: [112, 40],
      3: [92, 10],
      25: [98, 30],
      14: [98, 50],
      2: [92, 70],
      23: [66, 10],
      24: [70, 30],
      6: [70, 50],
      10: [66, 70],
      11: [32, 30],
      8: [32, 50],
    },
  },
  {
    name: "4-2-3-1",
    spots: {
      1: [112, 40],
      3: [92, 10],
      25: [98, 30],
      14: [98, 50],
      2: [92, 70],
      24: [78, 30],
      6: [78, 50],
      23: [52, 12],
      8: [54, 40],
      10: [52, 68],
      11: [28, 40],
    },
  },
  {
    name: "4-3-3",
    spots: {
      1: [112, 40],
      3: [92, 10],
      25: [98, 30],
      14: [98, 50],
      2: [92, 70],
      24: [70, 24],
      6: [76, 40],
      8: [70, 56],
      23: [38, 12],
      11: [28, 40],
      10: [38, 68],
    },
  },
  {
    name: "3-5-2",
    spots: {
      1: [112, 40],
      25: [98, 20],
      6: [100, 40],
      14: [98, 60],
      3: [66, 8],
      24: [74, 26],
      8: [60, 40],
      23: [74, 54],
      2: [66, 72],
      11: [32, 30],
      10: [32, 50],
    },
  },
];

const buttonClass =
  "size-8 rounded-md border border-fd-border bg-fd-card text-sm font-medium hover:bg-fd-accent";

/**
 * One XI in four shapes. Each player keeps their `key` across formations, so
 * a transition on `left`/`top`, passed through `className`, slides every
 * avatar to its new spot.
 */
export function PlayerAvatarFormationsBasic() {
  const [index, setIndex] = useState(0);
  const formation = formations[index]!;
  const go = (step: number) => setIndex((i) => (i + step + formations.length) % formations.length);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Formations"
      className="mx-auto max-w-[420px]"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          className={buttonClass}
          aria-label="Previous formation"
          onClick={() => go(-1)}
        >
          ‹
        </button>
        <div className="flex flex-col items-center gap-1.5">
          <span aria-live="polite" className="text-base font-semibold tabular-nums">
            {formation.name}
          </span>
          <div className="flex gap-1.5">
            {formations.map((f, i) => (
              <button
                key={f.name}
                type="button"
                aria-label={f.name}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={
                  i === index
                    ? "size-2 rounded-full bg-fd-primary"
                    : "size-2 rounded-full bg-fd-muted-foreground/40 hover:bg-fd-muted-foreground"
                }
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className={buttonClass}
          aria-label="Next formation"
          onClick={() => go(1)}
        >
          ›
        </button>
      </div>

      <VerticalPitch type="statsbomb" appearance={docsAppearance}>
        {squad.map((p) => {
          const [x, y] = formation.spots[p.number]!;
          return (
            <PlayerAvatar
              key={p.number}
              x={x}
              y={y}
              name={p.name}
              number={p.number}
              card={p.card}
              subbed={p.subbed}
              goals={p.goals}
              assists={p.assists}
              src={`/players/${p.photo}.webp`}
              className="motion-safe:transition-[left,top] motion-safe:duration-500 motion-safe:ease-in-out"
            />
          );
        })}
      </VerticalPitch>
    </div>
  );
}
