"use client";

import { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import type { PitchAppearance } from "@pitchkit/core";
import {
  Annotate,
  Arrows,
  Comet,
  ConvexHull,
  Flow,
  GoalAngle,
  Heatmap,
  Hexbin,
  KDE,
  Pitch,
  PositionalHeatmap,
  Scatter,
  VerticalPitch,
  Voronoi,
} from "@pitchkit/react";
import { isComplete, isCross, isGoal } from "@pitchkit/data-providers/statsbomb";
import type { StatsBombEvent } from "@pitchkit/data-providers/statsbomb";
import {
  bestChances,
  busiestPlayer,
  passNetwork,
  playerTouches,
  shortName,
  teamCarries,
  teamPasses,
  teamShots,
  touches,
} from "./statsbomb-derive";

const dimensions = getPitchDimensions("statsbomb");
const halfCrop = cropForHalf(dimensions);

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "1.5rem",
  marginTop: "1rem",
};
const cardTitleStyle: CSSProperties = {
  fontSize: "0.75rem",
  color: "#ddd",
  margin: "0 0 0.15rem",
  fontWeight: 600,
};
const cardNoteStyle: CSSProperties = {
  fontSize: "0.68rem",
  color: "#777",
  margin: "0 0 0.5rem",
  lineHeight: 1.45,
  minHeight: "2.6em",
};
const codeNoteStyle: CSSProperties = { color: "#9ca3af" };

function Viz({ title, note, children }: { title: string; note: ReactNode; children: ReactNode }) {
  return (
    <div>
      <p style={cardTitleStyle}>{title}</p>
      <p style={cardNoteStyle}>{note}</p>
      {children}
    </div>
  );
}

/**
 * Density layers paint an opaque fill across the whole pitch, which would
 * otherwise bury the markings — `linesOnTop` is mplsoccer's `line_zorder`.
 */
function withLinesOnTop(appearance: PitchAppearance): PitchAppearance {
  return { ...appearance, linesOnTop: true };
}

interface VisualsProps {
  events: readonly StatsBombEvent[];
  team: string;
  appearance: PitchAppearance;
  colorMin: string;
  colorMax: string;
}

export function StatsBombVisuals({ events, team, appearance, colorMin, colorMax }: VisualsProps) {
  // One derivation pass per match/team, not per render — the pass network in
  // particular is O(passes) with a couple of maps.
  const derived = useMemo(() => {
    const allShots = teamShots(events, team);
    const allPasses = teamPasses(events, team);
    const completedPasses = allPasses.filter(isComplete);
    const player = busiestPlayer(events, team);
    return {
      shots: allShots,
      passes: allPasses,
      completedPasses,
      crosses: allPasses.filter(isCross),
      carries: teamCarries(events, team),
      touches: touches(events, team),
      network: passNetwork(events, team),
      player,
      playerTouches: player === undefined ? [] : playerTouches(events, team, player),
      chances: bestChances(events, team),
    };
  }, [events, team]);

  const densityAppearance = withLinesOnTop(appearance);

  return (
    <div style={gridStyle}>
      <Viz
        title="Shot map"
        note={
          <>
            Attacking half, markers sized by xG. <code style={codeNoteStyle}>shots()</code> +{" "}
            <code style={codeNoteStyle}>isGoal</code>.
          </>
        }
      >
        <VerticalPitch type="statsbomb" appearance={appearance} crop={halfCrop}>
          <Scatter
            data={derived.shots}
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
              `${shortName(shot.player?.name)} — ${shot.shot.outcome.name}, ${shot.shot.statsbomb_xg.toFixed(2)} xG`
            }
          />
        </VerticalPitch>
      </Viz>

      <Viz
        title="Goal angle — best three chances"
        note="The wedge subtended at each shot by the goal mouth, so you can see how much of the goal was actually available."
      >
        <VerticalPitch type="statsbomb" appearance={appearance} crop={halfCrop}>
          <GoalAngle
            data={derived.chances}
            x={(shot) => shot.x}
            y={(shot) => shot.y}
            fill="var(--pitch-marker-goal)"
            fillOpacity={0.14}
            stroke="rgba(255,255,255,0.35)"
          />
          <Scatter
            data={derived.chances}
            x={(shot) => shot.x}
            y={(shot) => shot.y}
            r={5}
            fill="var(--pitch-marker-goal)"
            stroke="white"
            strokeWidth={1.5}
            tooltip={(shot) =>
              `${shortName(shot.player?.name)} — ${shot.shot.statsbomb_xg.toFixed(2)} xG`
            }
          />
        </VerticalPitch>
      </Viz>

      <Viz
        title="Pass map"
        note={
          <>
            Completed passes only — {derived.completedPasses.length} of {derived.passes.length}. The
            filter is <code style={codeNoteStyle}>isComplete</code>, which reads the{" "}
            <em>absence</em> of an outcome.
          </>
        }
      >
        <Pitch type="statsbomb" appearance={appearance}>
          <Arrows
            data={derived.completedPasses}
            x={(pass) => pass.x}
            y={(pass) => pass.y}
            x2={(pass) => pass.endX}
            y2={(pass) => pass.endY}
            stroke="var(--pitch-marker-primary)"
            strokeOpacity={0.35}
            strokeWidth={1}
            headSize={3}
          />
        </Pitch>
      </Viz>

      <Viz
        title="Pass network"
        note={`Players at their average passing position, joined where they combined 3+ times. ${derived.network.nodes.length} players, ${derived.network.edges.length} combinations.`}
      >
        <Pitch type="statsbomb" appearance={appearance}>
          <Arrows
            data={derived.network.edges}
            x={(edge) => edge.from.x}
            y={(edge) => edge.from.y}
            x2={(edge) => edge.to.x}
            y2={(edge) => edge.to.y}
            stroke="white"
            strokeOpacity={0.25}
            strokeWidth={(edge) => Math.min(1 + edge.count / 4, 6)}
            headSize={0.01}
          />
          <Scatter
            data={derived.network.nodes}
            x={(node) => node.x}
            y={(node) => node.y}
            r={(node) => 4 + Math.sqrt(node.passes) * 1.2}
            fill="var(--pitch-marker-primary)"
            fillOpacity={0.85}
            stroke="white"
            strokeWidth={1}
            tooltip={(node) => `${node.player} — ${node.passes} passes`}
          />
          <Annotate
            data={derived.network.nodes}
            x={(node) => node.x}
            y={(node) => node.y}
            label={(node) => node.player}
            offsetY={-12}
            className="fill-white text-[7px] [text-anchor:middle]"
          />
        </Pitch>
      </Viz>

      <Viz
        title="Pass flow"
        note="Passes binned by origin, one arrow per cell showing the dominant direction and volume — mplsoccer's flow."
      >
        <Pitch type="statsbomb" appearance={appearance}>
          <Flow
            data={derived.completedPasses}
            x={(pass) => pass.x}
            y={(pass) => pass.y}
            x2={(pass) => pass.endX}
            y2={(pass) => pass.endY}
            binsX={6}
            binsY={4}
            colorMin={colorMin}
            colorMax={colorMax}
            strokeWidthMin={1}
            strokeWidthMax={5}
          />
        </Pitch>
      </Viz>

      <Viz
        title="Crosses"
        note={`${derived.crosses.length} crosses, drawn as comets tapering toward the delivery point. isCross reads pass.cross.`}
      >
        <Pitch type="statsbomb" appearance={appearance}>
          <Comet
            data={derived.crosses}
            x={(pass) => pass.x}
            y={(pass) => pass.y}
            x2={(pass) => pass.endX}
            y2={(pass) => pass.endY}
            color="var(--pitch-marker-goal)"
            startWidth={0.4}
            endWidth={3}
            gradient
          />
        </Pitch>
      </Viz>

      <Viz
        title="Carries"
        note={`${derived.carries.length} ball carries — where this team actually moved the ball at their feet.`}
      >
        <Pitch type="statsbomb" appearance={appearance}>
          <Comet
            data={derived.carries}
            x={(carry) => carry.x}
            y={(carry) => carry.y}
            x2={(carry) => carry.endX}
            y2={(carry) => carry.endY}
            color="var(--pitch-marker-primary)"
            startWidth={0.3}
            endWidth={2}
            gradient
          />
        </Pitch>
      </Viz>

      <Viz
        title="Touch heatmap"
        note={`All ${derived.touches.length} located events, binned into a uniform grid.`}
      >
        <Pitch type="statsbomb" appearance={densityAppearance}>
          <Heatmap
            data={derived.touches}
            x={(event) => event.x}
            y={(event) => event.y}
            binsX={12}
            binsY={8}
            colorMin={colorMin}
            colorMax={colorMax}
          />
        </Pitch>
      </Viz>

      <Viz
        title="Positional heatmap"
        note="The same events binned into Juego de Posición zones derived from the markings, not a uniform grid."
      >
        <Pitch type="statsbomb" appearance={densityAppearance}>
          <PositionalHeatmap
            data={derived.touches}
            x={(event) => event.x}
            y={(event) => event.y}
            colorMin={colorMin}
            colorMax={colorMax}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={0.5}
          />
        </Pitch>
      </Viz>

      <Viz
        title="Hexbin"
        note="A hexagonal lattice packs more evenly than squares, so it shows less axis-aligned banding."
      >
        <Pitch type="statsbomb" appearance={densityAppearance}>
          <Hexbin
            data={derived.touches}
            x={(event) => event.x}
            y={(event) => event.y}
            binsX={14}
            colorMin={colorMin}
            colorMax={colorMax}
          />
        </Pitch>
      </Viz>

      <Viz
        title="KDE"
        note="A smooth density surface that fades to transparent, so the pitch stays visible where nothing happened."
      >
        <Pitch type="statsbomb" appearance={appearance}>
          <KDE
            data={derived.touches}
            x={(event) => event.x}
            y={(event) => event.y}
            colorMin={colorMin}
            colorMax={colorMax}
            maxOpacity={0.85}
          />
        </Pitch>
      </Viz>

      <Viz
        title="Shot xG heatmap"
        note="Weighted rather than counted: each bin sums the xG of the shots taken from it."
      >
        <VerticalPitch type="statsbomb" appearance={densityAppearance} crop={halfCrop}>
          <Heatmap
            data={derived.shots}
            x={(shot) => shot.x}
            y={(shot) => shot.y}
            weight={(shot) => shot.shot.statsbomb_xg}
            binsX={12}
            binsY={8}
            colorMin={colorMin}
            colorMax={colorMax}
          />
        </VerticalPitch>
      </Viz>

      <Viz
        title={`Territory — ${shortName(derived.player)}`}
        note={`Convex hull of the ${derived.playerTouches.length} located events for this team's busiest player.`}
      >
        <Pitch type="statsbomb" appearance={appearance}>
          <ConvexHull
            data={derived.playerTouches}
            x={(event) => event.x}
            y={(event) => event.y}
            fill="var(--pitch-marker-primary)"
            fillOpacity={0.18}
            stroke="var(--pitch-marker-primary)"
            strokeWidth={1.5}
          />
          <Scatter
            data={derived.playerTouches}
            x={(event) => event.x}
            y={(event) => event.y}
            r={2}
            fill="white"
            fillOpacity={0.65}
          />
        </Pitch>
      </Viz>

      <Viz
        title="Voronoi — average positions"
        note="Space each player is nearest to, from the same average positions as the pass network."
      >
        <Pitch type="statsbomb" appearance={appearance}>
          <Voronoi
            data={derived.network.nodes}
            x={(node) => node.x}
            y={(node) => node.y}
            fill="var(--pitch-marker-primary)"
            fillOpacity={0.12}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={0.75}
          />
          <Scatter
            data={derived.network.nodes}
            x={(node) => node.x}
            y={(node) => node.y}
            r={3}
            fill="white"
            tooltip={(node) => node.player}
          />
        </Pitch>
      </Viz>
    </div>
  );
}
