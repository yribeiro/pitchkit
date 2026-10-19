"use client";

import { useEffect, useState } from "react";
import {
  fetchMatches,
  fetchSquads,
  IMPECT_BUNDESLIGA_2023_24,
  indexSquadsById,
} from "@pitchkit/data-providers/impect";
import type { ImpectMatchSummary, ImpectSquad } from "@pitchkit/data-providers/impect";

/**
 * Chrome for the live Impect example, and only chrome. The example is
 * rendered with its own source visible (see components/pitch-preview.tsx),
 * so the part worth reading — fetch → narrow → plot — stays written out
 * inline there rather than hidden behind an import from here.
 */

/** Werder Bremen 0–4 Bayern, the season's opening match: a recognisable default. */
export const DEFAULT_MATCH_ID = 122838;

export interface ImpectSeason {
  readonly matches: readonly ImpectMatchSummary[];
  readonly squads: ReadonlyMap<number, ImpectSquad>;
}

/** The 306 matches and 18 clubs of Impect's Bundesliga 2023/24 (~190 KB together). */
export function useImpectSeason(): ImpectSeason | undefined {
  const [season, setSeason] = useState<ImpectSeason>();

  useEffect(() => {
    Promise.all([fetchMatches(IMPECT_BUNDESLIGA_2023_24), fetchSquads(IMPECT_BUNDESLIGA_2023_24)])
      .then(([matches, squads]) => {
        setSeason({
          matches: [...matches].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
          squads: indexSquadsById(squads),
        });
      })
      .catch(() => {
        /* the example surfaces its own load failure */
      });
  }, []);

  return season;
}

/** "Matchday 1 · SV Werder Bremen v FC Bayern München". The match list has no score. */
export function matchLabel(match: ImpectMatchSummary, season: ImpectSeason): string {
  const name = (id: number) => season.squads.get(id)?.name ?? `Squad ${id}`;
  return `Matchday ${match.matchDay.index + 1} · ${name(match.homeSquadId)} v ${name(match.awaySquadId)}`;
}

export const selectClass =
  "w-full min-w-0 rounded-md border border-fd-border bg-fd-card py-1.5 pl-2 pr-8 text-sm disabled:opacity-50 sm:w-auto sm:max-w-md";
