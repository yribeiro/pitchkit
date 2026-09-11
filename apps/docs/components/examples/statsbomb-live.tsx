"use client";

import { useEffect, useState } from "react";
import { DataProviderError, fetchMatches } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombMatch } from "@pitchkit/data-providers/statsbomb";

/**
 * Shared chrome for the two live StatsBomb examples — the competition ids,
 * the match list, and the picker/status controls.
 *
 * Deliberately *only* chrome. The examples themselves are rendered with
 * their source visible (see components/pitch-preview.tsx), so the part
 * worth reading — `loadEvents(...)` → `shots()` → `.filter(isGoal)` → JSX —
 * stays written out inline in each example rather than hidden behind an
 * import from here.
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

export function describeError(error: unknown): string {
  if (error instanceof DataProviderError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong loading that match.";
}

/** Euro 2024's match list (~93 KB), newest fixtures last. */
export function useEuroMatches(): {
  matches: StatsBombMatch[];
  error: string | undefined;
} {
  const [matches, setMatches] = useState<StatsBombMatch[]>([]);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    fetchMatches(EURO_2024.competitionId, EURO_2024.seasonId)
      .then((rows) => {
        if (cancelled) return;
        setMatches([...rows].sort((a, b) => a.match_date.localeCompare(b.match_date)));
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { matches, error };
}

/**
 * Controls row. Stacks on narrow viewports and lets the select take the
 * full width — these examples are read on phones as often as not.
 */
export function ExampleControls({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  );
}

export function ExampleLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-fd-muted-foreground">{children}</span>;
}

/** Uses fumadocs' own tokens, so it follows the site's light/dark theme. */
export function ExampleSelect({
  value,
  onChange,
  label,
  disabled,
  children,
}: {
  value: string | number;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full min-w-0 rounded-md border border-fd-border bg-fd-card px-2 py-1.5 text-sm text-fd-foreground disabled:opacity-50 sm:w-auto sm:max-w-xs"
    >
      {children}
    </select>
  );
}

export function ExampleButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-fd-border bg-fd-card px-3 py-1.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function ExampleStatus({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-xs text-fd-muted-foreground">{children}</p>;
}

export function ExampleError({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
      {children}
    </p>
  );
}
