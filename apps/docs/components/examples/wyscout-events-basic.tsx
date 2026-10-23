"use client";

import { useEffect, useState } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { Scatter, VerticalPitch } from "@pitchkit/react";
import {
  fetchMatch,
  goalAttempts,
  indexPlayersById,
  isGoal,
  isOwnGoal,
  shotGoalZone,
} from "@pitchkit/data-providers/wyscout";
import type { WyscoutEvent, WyscoutPlayer } from "@pitchkit/data-providers/wyscout";
import { docsAppearance } from "./docs-appearance";
import { DEFAULT_MATCH_ID, WYSCOUT_MATCHES, selectClass } from "./wyscout-live";

const dimensions = getPitchDimensions("wyscout");

/** The curated shortlist over a line of status text. */
function MatchSelector({
  value,
  onChange,
  status,
}: {
  value: number;
  onChange: (matchId: number) => void;
  status: string;
}) {
  return (
    <>
      <select
        aria-label="Wyscout match"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={selectClass}
      >
        {WYSCOUT_MATCHES.map((match) => (
          <option key={match.id} value={match.id}>
            {match.label}
          </option>
        ))}
      </select>
      <p className="my-3 text-xs text-fd-muted-foreground">{status}</p>
    </>
  );
}

interface Loaded {
  readonly attempts: readonly WyscoutEvent[];
  readonly goals: number;
  readonly ownGoals: number;
  readonly players: Map<number, WyscoutPlayer>;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * A shot map built from a real Wyscout match, fetched in the browser.
 *
 * `goalAttempts(events)` first, `.filter(isGoal)` after — in that order.
 * Wyscout tags a goal on the conceding keeper's save as well as on the
 * attempt that scored it, so filtering the *whole* feed for the goal tag
 * counts each one twice. `goalAttempts` rather than `shots`, because a
 * penalty or direct free kick is a `Free Kick` event, not a `Shot`.
 *
 * An own goal is neither: it carries its own tag, 102, on the event of the
 * player who put it in. Shootout kicks (`matchPeriod: "P"`) are attempts but not goals.
 */
export function WyscoutEventsBasic() {
  const [matchId, setMatchId] = useState(DEFAULT_MATCH_ID);
  // Keyed by the match it belongs to, so "still loading" is derived rather
  // than a second state field.
  const [result, setResult] = useState<{ key: number; value: Loaded } | undefined>();
  const [failed, setFailed] = useState(false);

  const loaded = result?.key === matchId ? result.value : undefined;

  useEffect(() => {
    fetchMatch(matchId)
      .then((match) => {
        const attempts = goalAttempts(match.events);
        setResult({
          key: matchId,
          value: {
            attempts,
            goals: attempts.filter((e) => isGoal(e) && e.matchPeriod !== "P").length,
            ownGoals: match.events.filter(isOwnGoal).length,
            players: indexPlayersById(match),
          },
        });
      })
      .catch(() => setFailed(true));
  }, [matchId]);

  return (
    <div>
      <MatchSelector
        value={matchId}
        onChange={(next) => {
          setFailed(false);
          setMatchId(next);
        }}
        status={
          failed
            ? "Couldn't reach Wyscout open data."
            : loaded === undefined
              ? "Fetching the match (~480 KB)…"
              : `${plural(loaded.attempts.length, "attempt")} · ${plural(loaded.goals + loaded.ownGoals, "goal")}` +
                (loaded.ownGoals > 0 ? ` (${plural(loaded.ownGoals, "own goal")})` : "")
        }
      />

      <VerticalPitch type="wyscout" appearance={docsAppearance} crop={cropForHalf(dimensions)}>
        <Scatter
          data={loaded?.attempts ?? []}
          x={(shot) => shot.x}
          y={(shot) => shot.y}
          r={(shot) => (isGoal(shot) ? 6 : 4)}
          fill={(shot) =>
            isGoal(shot) ? "var(--pitch-marker-goal)" : "var(--pitch-marker-primary)"
          }
          fillOpacity={(shot) => (isGoal(shot) ? 0.95 : 0.55)}
          stroke="white"
          strokeWidth={(shot) => (isGoal(shot) ? 2 : 1)}
          tooltip={(shot) => {
            const player = loaded?.players.get(shot.playerId)?.shortName ?? "Unknown";
            // No end coordinate on a shot — where it went is a tag, read
            // through shotGoalZone, not positions[1]. See "Reading the
            // fields" below. Penalties carry the same goal-mouth tags.
            const outcome = isGoal(shot) ? "Goal" : (shotGoalZone(shot) ?? "Blocked");
            return `${player} — ${outcome}`;
          }}
        />
      </VerticalPitch>
    </div>
  );
}
