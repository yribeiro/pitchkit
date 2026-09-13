"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Arrows, Pitch } from "@pitchkit/react";
import {
  fetchMatch,
  fetchMatches,
  fetchPhasesOfPlay,
  phaseLedToShot,
} from "@pitchkit/data-providers/skillcorner";
import type {
  SkillCornerMatch,
  SkillCornerMatchSummary,
  SkillCornerPhase,
} from "@pitchkit/data-providers/skillcorner";
import { docsAppearance } from "./docs-appearance";
import { DEFAULT_MATCH_ID, matchLabel, selectClass } from "./skillcorner-live";

const TEAM_COLORS = ["var(--pitch-marker-primary)", "var(--pitch-marker-goal)"] as const;

interface Loaded {
  readonly match: SkillCornerMatch;
  readonly phases: readonly SkillCornerPhase[];
}

/**
 * Load a match's phases of play — the smallest of SkillCorner's three files
 * at around 110 KB, and the one that describes the match as a sequence of
 * possessions rather than as individual actions.
 */
async function loadPhases(matchId: number, signal: AbortSignal): Promise<Loaded> {
  const match = await fetchMatch(matchId, { signal });
  const phases = await fetchPhasesOfPlay(match, { signal });
  // Only phases that travelled somewhere can be drawn as an arrow.
  return {
    match,
    phases: phases.filter(
      (phase) => typeof phase.x_start === "number" && typeof phase.x_end === "number",
    ),
  };
}

function usePhases(matchId: number) {
  const [loaded, setLoaded] = useState<{ key: number; value: Loaded } | undefined>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadPhases(matchId, controller.signal)
      .then((value) => setLoaded({ key: matchId, value }))
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [matchId]);

  return { loaded: loaded?.key === matchId ? loaded.value : undefined, failed };
}

/** Match picker, any extra controls, and the status line. */
function MatchPicker({
  value,
  onChange,
  status,
  children,
}: {
  value: number;
  onChange: (id: number) => void;
  status: ReactNode;
  children?: ReactNode;
}) {
  const [matches, setMatches] = useState<SkillCornerMatchSummary[]>([]);

  useEffect(() => {
    fetchMatches()
      .then(setMatches)
      .catch(() => undefined);
  }, []);

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          aria-label="SkillCorner match"
          value={value}
          disabled={matches.length === 0}
          onChange={(event) => onChange(Number(event.target.value))}
          className={selectClass}
        >
          {matches.length === 0 && <option value={DEFAULT_MATCH_ID}>Loading matches…</option>}
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {matchLabel(match)}
            </option>
          ))}
        </select>
        {children}
      </div>
      <p className="my-3 text-xs text-fd-muted-foreground">{status}</p>
    </>
  );
}

/**
 * Phases of play from a real SkillCorner match: one arrow per possession,
 * from where it started to where it got to. The ones that produced a shot
 * are what you're looking for, so they're the ones picked out.
 */
export function SkillcornerPhasesBasic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  const [phaseType, setPhaseType] = useState("all");
  const { loaded, failed } = usePhases(matchId);

  const phaseTypes = useMemo(() => {
    const seen = new Set<string>();
    for (const phase of loaded?.phases ?? []) {
      if (phase.team_in_possession_phase_type) seen.add(phase.team_in_possession_phase_type);
    }
    return [...seen].sort();
  }, [loaded]);

  const phases = (loaded?.phases ?? []).filter(
    (phase) => phaseType === "all" || phase.team_in_possession_phase_type === phaseType,
  );

  return (
    <div>
      <MatchPicker
        value={matchId}
        onChange={setMatchId}
        status={
          failed
            ? "Couldn't reach SkillCorner open data."
            : loaded === undefined
              ? "Fetching phases of play (~110 KB)…"
              : `${phases.length} phases · ${phases.filter(phaseLedToShot).length} led to a shot (highlighted)`
        }
      >
        {phaseTypes.length > 0 && (
          <select
            aria-label="Phase type"
            value={phaseType}
            onChange={(event) => setPhaseType(event.target.value)}
            className={selectClass}
          >
            <option value="all">All phase types</option>
            {phaseTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        )}
      </MatchPicker>

      <Pitch
        type="skillcorner"
        dimensions={
          loaded && { length: loaded.match.pitch_length, width: loaded.match.pitch_width }
        }
        appearance={docsAppearance}
      >
        <Arrows
          data={phases}
          x={(phase) => phase.x_start ?? 0}
          y={(phase) => phase.y_start ?? 0}
          x2={(phase) => phase.x_end ?? 0}
          y2={(phase) => phase.y_end ?? 0}
          stroke={(phase: SkillCornerPhase) =>
            phaseLedToShot(phase) ? TEAM_COLORS[1] : TEAM_COLORS[0]
          }
          strokeOpacity={(phase: SkillCornerPhase) => (phaseLedToShot(phase) ? 0.9 : 0.22)}
          strokeWidth={(phase: SkillCornerPhase) => (phaseLedToShot(phase) ? 0.7 : 0.3)}
          headSize={4}
          tooltip={(phase) =>
            `${phase.team_in_possession_shortname ?? "?"} — ${
              phase.team_in_possession_phase_type?.replace(/_/g, " ") ?? "phase"
            }${phaseLedToShot(phase) ? " → shot" : ""}`
          }
        />
      </Pitch>
    </div>
  );
}
