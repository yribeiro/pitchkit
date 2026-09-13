"use client";

import type { SkillCornerMatchSummary } from "@pitchkit/data-providers/skillcorner";

/**
 * Chrome shared by the three live SkillCorner examples — and *only* chrome.
 *
 * Every example below fetches its own data inline, including the match list,
 * because each one's source is what the reader sees in the View Code panel.
 * Hiding `fetchMatches` or `streamTracking` behind an import here would take
 * the lesson out of the lesson.
 */

/** Brisbane Roar v Adelaide United — a match with good camera coverage. */
export const DEFAULT_MATCH_ID = 1874553;

export function matchLabel(match: SkillCornerMatchSummary): string {
  return `${match.home_team.short_name} v ${match.away_team.short_name}`;
}

export const controlClass =
  "rounded-md border border-fd-border bg-fd-card py-1.5 text-sm disabled:opacity-50";

export const selectClass = `w-full min-w-0 pl-2 pr-8 sm:w-auto sm:max-w-xs ${controlClass}`;
export const buttonClass = `px-3 font-medium hover:bg-fd-accent ${controlClass}`;
