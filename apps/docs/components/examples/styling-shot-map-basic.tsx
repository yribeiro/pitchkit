"use client";

import { useEffect, useState } from "react";
import { Pitch, Scatter } from "@pitchkit/react";
import { fetchMatchEvents, isGoal, shots } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombShot } from "@pitchkit/data-providers/statsbomb";

/** Euro 2024 final — Spain 2–1 England, Berlin, 14 July 2024. */
const EURO_2024_FINAL = 3943043;

interface TeamClasses {
  /** The team's name and score in the header. */
  text: string;
  /** Shots that weren't goals. */
  shot: string;
  /** Goals. */
  goal: string;
}

interface Palette {
  name: string;
  card: string;
  muted: string;
  pitch: string;
  spain: TeamClasses;
  england: TeamClasses;
}

// Every colour is a Tailwind class. The palette colours themselves
// (`newsprint-paper`, `dracula-pink`, …) are added to the theme in globals.css.
const PALETTES: Palette[] = [
  {
    name: "Newsprint",
    card: "bg-newsprint-paper text-newsprint-ink",
    muted: "text-newsprint-muted",
    pitch:
      "pitch-surface-newsprint-paper pitch-stripe-newsprint-stripe pitch-lines-newsprint-rule pitch-line-width-1",
    spain: {
      text: "text-newsprint-red",
      shot: "fill-newsprint-red/35 stroke-newsprint-red",
      goal: "fill-newsprint-red stroke-newsprint-paper",
    },
    england: {
      text: "text-newsprint-navy",
      shot: "fill-newsprint-navy/35 stroke-newsprint-navy",
      goal: "fill-newsprint-navy stroke-newsprint-paper",
    },
  },
  {
    name: "Analyst navy",
    card: "bg-analyst-card text-analyst-text",
    muted: "text-analyst-muted",
    pitch:
      "pitch-surface-analyst-pitch pitch-stripe-analyst-stripe pitch-lines-analyst-line pitch-line-width-1",
    spain: {
      text: "text-analyst-orange",
      shot: "fill-analyst-orange/30 stroke-analyst-orange",
      goal: "fill-analyst-orange stroke-analyst-pitch",
    },
    england: {
      text: "text-analyst-sky",
      shot: "fill-analyst-sky/30 stroke-analyst-sky",
      goal: "fill-analyst-sky stroke-analyst-pitch",
    },
  },
  {
    name: "Dracula",
    card: "bg-dracula-darker text-dracula-foreground",
    muted: "text-dracula-comment",
    pitch:
      "pitch-surface-dracula-background pitch-stripe-dracula-stripe pitch-lines-dracula-comment pitch-line-width-[1.5]",
    spain: {
      text: "text-dracula-pink",
      shot: "fill-dracula-pink/30 stroke-dracula-pink",
      goal: "fill-dracula-pink stroke-dracula-background",
    },
    england: {
      text: "text-dracula-cyan",
      shot: "fill-dracula-cyan/30 stroke-dracula-cyan",
      goal: "fill-dracula-cyan stroke-dracula-background",
    },
  },
  {
    name: "Gruvbox",
    card: "bg-gruvbox-bg0-hard text-gruvbox-fg",
    muted: "text-gruvbox-fg4",
    pitch:
      "pitch-surface-gruvbox-bg pitch-stripe-gruvbox-bg0-soft pitch-lines-gruvbox-fg4 pitch-line-width-[1.5]",
    spain: {
      text: "text-gruvbox-red",
      shot: "fill-gruvbox-red/30 stroke-gruvbox-red",
      goal: "fill-gruvbox-red stroke-gruvbox-bg",
    },
    england: {
      text: "text-gruvbox-yellow",
      shot: "fill-gruvbox-yellow/30 stroke-gruvbox-yellow",
      goal: "fill-gruvbox-yellow stroke-gruvbox-bg",
    },
  },
];

/** Marker area grows with xG, so a 0.7 chance reads as roughly ten times a 0.07 one. */
const radius = (shot: StatsBombShot) => 3 + Math.sqrt(shot.shot.statsbomb_xg) * 14;

const tooltip = (shot: StatsBombShot) =>
  `${shot.player?.name ?? "Unknown"}, ${shot.minute}' — ${shot.shot.statsbomb_xg.toFixed(2)} xG`;

/** StatsBomb records every shot attacking left to right. Flip one team to face the other way. */
const mirror = (shot: StatsBombShot): StatsBombShot => ({
  ...shot,
  x: 120 - shot.x,
  y: 80 - shot.y,
});

function TeamShots({ data, classes }: { data: StatsBombShot[]; classes: TeamClasses }) {
  return (
    <>
      <Scatter
        data={data.filter((s) => !isGoal(s))}
        x={(s) => s.x}
        y={(s) => s.y}
        r={radius}
        strokeWidth={1.25}
        className={classes.shot}
        tooltip={tooltip}
      />
      <Scatter
        data={data.filter(isGoal)}
        x={(s) => s.x}
        y={(s) => s.y}
        r={radius}
        strokeWidth={1.5}
        className={classes.goal}
        tooltip={tooltip}
      />
    </>
  );
}

function summary(data: StatsBombShot[]) {
  const xg = data.reduce((total, s) => total + s.shot.statsbomb_xg, 0);
  return {
    goals: data.filter(isGoal).length,
    detail: `${data.length} shots · ${xg.toFixed(2)} xG`,
  };
}

/**
 * Every shot from the Euro 2024 final, in four palettes. Spain attack right,
 * England left; marker size is xG and goals are solid. Switching palette
 * swaps class strings and nothing else.
 */
export function StylingShotMapBasic() {
  const [all, setAll] = useState<StatsBombShot[]>([]);
  const [failed, setFailed] = useState(false);
  const [palette, setPalette] = useState(PALETTES[0]!);

  useEffect(() => {
    fetchMatchEvents(EURO_2024_FINAL)
      // Period 5 is the penalty shootout; there wasn't one, but it isn't open play either.
      .then((events) => setAll(shots(events).filter((s) => s.period <= 4)))
      .catch(() => setFailed(true));
  }, []);

  const spain = all.filter((s) => s.team.name === "Spain");
  const england = all.filter((s) => s.team.name === "England").map(mirror);
  const home = summary(spain);
  const away = summary(england);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {PALETTES.map((p) => (
          <button
            key={p.name}
            type="button"
            aria-pressed={p === palette}
            onClick={() => setPalette(p)}
            className={`rounded-md border bg-fd-card px-3 py-1.5 text-sm ${p === palette ? "border-fd-primary text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className={`rounded-xl p-4 ${palette.card}`}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className={`text-lg font-bold ${palette.england.text}`}>England {away.goals}</div>
            <div className={`text-xs ${palette.muted}`}>{away.detail}</div>
          </div>
          <div className={`text-center text-xs ${palette.muted}`}>
            {failed
              ? "Couldn't reach StatsBomb open data."
              : all.length === 0
                ? "Loading…"
                : "Euro 2024 final"}
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${palette.spain.text}`}>{home.goals} Spain</div>
            <div className={`text-xs ${palette.muted}`}>{home.detail}</div>
          </div>
        </div>

        <Pitch
          type="statsbomb"
          appearance={{ stripes: true, goalType: "box" }}
          className={palette.pitch}
        >
          <TeamShots data={england} classes={palette.england} />
          <TeamShots data={spain} classes={palette.spain} />
        </Pitch>

        <p className={`mt-2 text-xs ${palette.muted}`}>
          Marker size is xG · solid markers are goals · data: StatsBomb
        </p>
      </div>
    </div>
  );
}
