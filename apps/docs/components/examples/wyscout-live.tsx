"use client";

/**
 * Chrome shared by the live Wyscout example — and *only* chrome. The example
 * is rendered with its own source visible (see components/pitch-preview.tsx),
 * so the part worth reading — fetch → narrow → plot — stays written out
 * inline there rather than hidden behind an import from here.
 */

export interface WyscoutMatchOption {
  readonly id: number;
  readonly label: string;
}

/**
 * A curated shortlist, not the dataset's full index.
 *
 * The open-data mirror this package fetches from publishes no JSON index of
 * its 1,941 matches — only a generated Markdown table (`processed/README.md`)
 * — and turning that into a `fetchMatches()` would mean a published package
 * parsing another site's Markdown formatting rather than its data. These five
 * are picked for goals and recognisability; any of the dataset's match ids
 * works the same way with `fetchMatch`.
 */
export const WYSCOUT_MATCHES: readonly WyscoutMatchOption[] = [
  { id: 2499943, label: "Liverpool 4–3 Manchester City (2018)" },
  { id: 2058017, label: "France 4–2 Croatia — 2018 World Cup final" },
  { id: 1694440, label: "Portugal 1–0 France — Euro 2016 final" },
  { id: 2565907, label: "Barcelona 2–2 Real Madrid (2018)" },
  { id: 2499841, label: "Huddersfield Town 1–2 Manchester City (2017)" },
];

export const DEFAULT_MATCH_ID = WYSCOUT_MATCHES[0]!.id;

export const controlClass =
  "rounded-md border border-fd-border bg-fd-card py-1.5 text-sm disabled:opacity-50";

export const selectClass = `w-full min-w-0 pl-2 pr-8 sm:w-auto sm:max-w-xs ${controlClass}`;
