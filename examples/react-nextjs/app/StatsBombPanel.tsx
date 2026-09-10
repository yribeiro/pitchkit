"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import type { PitchAppearance } from "@pitchkit/core";
import { Scatter, VerticalPitch } from "@pitchkit/react";
import {
  DataProviderError,
  isGoal,
  isOnTarget,
  loadEvents,
  matchEventsUrl,
  shots,
} from "@pitchkit/data-providers/statsbomb";
import type { StatsBombShot } from "@pitchkit/data-providers/statsbomb";

const DEFAULT_URL = matchEventsUrl(15946);
const dimensions = getPitchDimensions("statsbomb");

const formStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  alignItems: "center",
  margin: "0 0 1rem",
};
const urlInputStyle: CSSProperties = {
  flex: "1 1 28rem",
  minWidth: 0,
  background: "#111",
  color: "#eee",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.4rem 0.5rem",
  fontSize: "0.75rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const buttonStyle: CSSProperties = {
  fontSize: "0.8rem",
  color: "#eee",
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.4rem 0.9rem",
  cursor: "pointer",
};
const selectStyle: CSSProperties = {
  background: "#111",
  color: "#eee",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "0.3rem 0.4rem",
  fontSize: "0.8rem",
};
const statusStyle: CSSProperties = {
  fontSize: "0.75rem",
  color: "#bbb",
  margin: "0 0 1rem",
  lineHeight: 1.5,
};
const errorStyle: CSSProperties = {
  ...statusStyle,
  color: "#fca5a5",
  background: "#2a1717",
  border: "1px solid #5b2626",
  borderRadius: 6,
  padding: "0.6rem 0.8rem",
};

/** A DataProviderError already says what went wrong; anything else may not. */
function describeError(error: unknown): string {
  if (error instanceof DataProviderError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong loading that URL.";
}

interface StatsBombPanelProps {
  appearance: PitchAppearance;
}

/**
 * Paste a StatsBomb open-data events URL, get a shot map.
 *
 * The fetch runs **in the browser**, deliberately. raw.githubusercontent.com
 * sends `Access-Control-Allow-Origin: *`, so no proxy is needed — and doing
 * it here rather than in a route handler avoids handing a server an
 * arbitrary user-supplied URL to fetch, which would be an SSRF footgun. The
 * cost is that a ~3 MB events file is downloaded by the client, hence the
 * explicit loading state.
 */
export function StatsBombPanel({ appearance }: StatsBombPanelProps) {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loaded, setLoaded] = useState<{ url: string; shots: StatsBombShot[] } | undefined>();
  const [team, setTeam] = useState<string | undefined>();

  async function load() {
    setLoading(true);
    setError(undefined);
    try {
      // One call does fetch + parse. Everything below is plain array work.
      const events = await loadEvents(url);
      const shotList = shots(events);
      setLoaded({ url, shots: shotList });
      setTeam(shotList[0]?.team.name);
    } catch (cause) {
      setError(describeError(cause));
      setLoaded(undefined);
    } finally {
      setLoading(false);
    }
  }

  const teams = useMemo(
    () => [...new Set((loaded?.shots ?? []).map((shot) => shot.team.name))],
    [loaded],
  );

  const visible = useMemo(
    () => (loaded?.shots ?? []).filter((shot) => shot.team.name === team),
    [loaded, team],
  );

  const totalXg = visible.reduce((sum, shot) => sum + shot.shot.statsbomb_xg, 0);

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>@pitchkit/data-providers — load a real match</h2>
      <p>
        Paste any StatsBomb open-data events URL and render its shot map. Fetched and parsed by{" "}
        <code>loadEvents(url)</code>, filtered with <code>shots()</code> and <code>isGoal</code>.
      </p>

      <div style={formStyle}>
        <input
          type="url"
          style={urlInputStyle}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void load();
          }}
          aria-label="StatsBomb events JSON URL"
          spellCheck={false}
        />
        <button type="button" style={buttonStyle} onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : "Load"}
        </button>
        {teams.length > 1 && (
          <select
            style={selectStyle}
            value={team ?? ""}
            onChange={(event) => setTeam(event.target.value)}
            aria-label="Team"
          >
            {teams.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error !== undefined && <p style={errorStyle}>{error}</p>}

      {loading && <p style={statusStyle}>Fetching… a full match is around 3 MB.</p>}

      {!loading && error === undefined && loaded === undefined && (
        <p style={statusStyle}>Press Load to fetch the default match (Barcelona v Deportivo).</p>
      )}

      {loaded !== undefined && loaded.shots.length === 0 && (
        <p style={statusStyle}>That file parsed fine, but contains no shots.</p>
      )}

      {visible.length > 0 && (
        <>
          <p style={statusStyle}>
            {visible.length} shots · {visible.filter(isGoal).length} goals ·{" "}
            {visible.filter(isOnTarget).length} on target · {totalXg.toFixed(2)} xG
          </p>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <VerticalPitch type="statsbomb" appearance={appearance} crop={cropForHalf(dimensions)}>
              <Scatter
                data={visible}
                // x/y are lifted from StatsBomb's `location` array by the
                // parser, so they drop straight into an accessor.
                x={(shot) => shot.x}
                y={(shot) => shot.y}
                r={(shot) => 3 + Math.sqrt(shot.shot.statsbomb_xg) * 11}
                fill={(shot) =>
                  isGoal(shot) ? "var(--pitch-marker-goal)" : "var(--pitch-marker-primary)"
                }
                fillOpacity={(shot) => (isGoal(shot) ? 0.95 : 0.55)}
                stroke="white"
                strokeWidth={(shot) => (isGoal(shot) ? 2 : 1)}
                tooltip={(shot) =>
                  `${shot.player?.name ?? "Unknown"} — ${shot.shot.outcome.name}, ${shot.shot.statsbomb_xg.toFixed(2)} xG (${shot.minute}')`
                }
              />
            </VerticalPitch>
          </div>
        </>
      )}
    </section>
  );
}
