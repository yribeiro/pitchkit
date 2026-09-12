"use client";

import { useEffect, useState } from "react";
import { fetchMatches } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombMatch } from "@pitchkit/data-providers/statsbomb";

/**
 * The match list shared by the two live StatsBomb examples.
 *
 * Deliberately the *only* thing shared. Each example is rendered with its
 * source visible (see components/pitch-preview.tsx), so the part worth
 * reading — fetch → select → plot — stays written out inline there rather
 * than hidden behind an import from here.
 */

/**
 * UEFA Euro 2024. Scoped to one competition on purpose: 51 matches is a
 * browsable dropdown, and every one of them has 360 coverage, so the same
 * picker serves both the events and the tracking example.
 */
export const EURO_2024 = { competitionId: 55, seasonId: 282 } as const;

/** The final, Spain 2–1 England — a recognisable default to land on. */
export const DEFAULT_MATCH_ID = 3943043;

export function matchLabel(match: StatsBombMatch): string {
  return `${match.home_team.home_team_name} ${match.home_score}–${match.away_score} ${match.away_team.away_team_name}`;
}

/** Euro 2024's match list (~93 KB), in kickoff order. */
export function useEuroMatches(): StatsBombMatch[] {
  const [matches, setMatches] = useState<StatsBombMatch[]>([]);

  useEffect(() => {
    fetchMatches(EURO_2024.competitionId, EURO_2024.seasonId)
      .then((rows) => {
        setMatches([...rows].sort((a, b) => a.match_date.localeCompare(b.match_date)));
      })
      .catch(() => {
        /* each example surfaces its own load failure */
      });
  }, []);

  return matches;
}

/**
 * Shared only so the two pickers look the same; nothing example-specific.
 * Horizontal padding is left to the caller — a native select needs room on
 * the right for its own chevron, a button doesn't.
 */
export const controlClass =
  "rounded-md border border-fd-border bg-fd-card py-1.5 text-sm disabled:opacity-50";
