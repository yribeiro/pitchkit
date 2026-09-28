/**
 * The PitchKit charts the posts and reels are built from. Every one of these
 * is plain `@pitchkit/react` — the same components a user installs — fed with
 * the real match data in `src/data/`.
 */
import type { CSSProperties, ReactNode } from "react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import type { Orientation } from "@pitchkit/core";
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
import { PitchStage } from "./components/Chrome";
import {
  oyarzabalGoal,
  spainCarries,
  spainNetwork,
  spainPasses,
  surname,
  yamalTouches,
  finalShots,
} from "./data";
import type { GoalChain, Move, Shot } from "./data";
import { appearance, C, densityAppearance, PAD, PAD_V } from "./theme";

export const STATSBOMB = getPitchDimensions("statsbomb");
/** StatsBomb's pitch is 120 x 80: the pixel height that fits a horizontal pitch of this width. */
export const pitchHeightFor = (width: number) =>
  Math.round(((width - PAD.left - PAD.right) * 80) / 120 + PAD.top + PAD.bottom);
/** The same for a vertical pitch, whose long axis runs down the screen. */
export const verticalPitchHeightFor = (width: number) =>
  Math.round(((width - PAD_V.left - PAD_V.right) * 120) / 80 + PAD_V.top + PAD_V.bottom);

/** Marker area grows with xG, so a 0.7 chance reads as ~10x a 0.07 one. */
export const shotRadius = (xg: number, scale = 1) => (5 + Math.sqrt(xg) * 26) * scale;

/**
 * A horizontal pitch turned upright by a CSS rotation, attacking up the
 * screen.
 *
 * Not `orientation="vertical"`: that swaps the axes (x runs down, y across),
 * which is a *reflection* of the horizontal pitch — the attack runs down the
 * screen and left/right are mirrored, so a right winger lands on the left.
 * A -90° rotation keeps the pitch's handedness.
 */
export function Upright({
  width,
  height,
  turn = -90,
  children,
}: {
  /** The upright box's size — the horizontal pitch inside is `height` x `width`. */
  width: number;
  height: number;
  /** -90 attacks toward +x going up; 90 attacks toward -x going up. */
  turn?: -90 | 90;
  children: ReactNode;
}) {
  return (
    <div style={{ position: "relative", width, height }}>
      <div
        style={{
          position: "absolute",
          left: (width - height) / 2,
          top: (height - width) / 2,
          width: height,
          height: width,
          transform: `rotate(${turn}deg)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Shot map                                                                  */
/* ------------------------------------------------------------------------ */

/** One team's shots on the attacking half, vertical — the classic shot map. */
export function HalfShotMap({
  shots,
  width,
  height,
  color = C.sky,
  goalColor = C.orange,
  scale = 1,
}: {
  shots: Shot[];
  width: number;
  height: number;
  color?: string;
  goalColor?: string;
  scale?: number;
}) {
  const best = shots.filter((s) => s.goal).sort((a, b) => b.xg - a.xg)[0];
  return (
    <PitchStage>
      <VerticalPitch
        type="statsbomb"
        width={width}
        height={height}
        padding={PAD_V}
        appearance={appearance}
        crop={cropForHalf(STATSBOMB)}
      >
        {best && (
          <GoalAngle
            data={[best]}
            x={(s) => s.x}
            y={(s) => s.y}
            fill={goalColor}
            fillOpacity={0.14}
            stroke="rgba(255,255,255,0.35)"
          />
        )}
        <Scatter
          data={shots.filter((s) => !s.goal)}
          x={(s) => s.x}
          y={(s) => s.y}
          r={(s) => shotRadius(s.xg, scale)}
          fill={color}
          fillOpacity={0.55}
          stroke="white"
          strokeWidth={1.5}
        />
        <Scatter
          data={shots.filter((s) => s.goal)}
          x={(s) => s.x}
          y={(s) => s.y}
          r={(s) => shotRadius(s.xg, scale)}
          fill={goalColor}
          fillOpacity={0.95}
          stroke="white"
          strokeWidth={3}
        />
        <Annotate
          data={shots.filter((s) => s.goal)}
          x={(s) => s.x}
          y={(s) => s.y}
          label={(s) => `${surname(s.player)} ${s.minute + 1}'`}
          offsetY={(s) => -shotRadius(s.xg, scale) - 14}
        />
      </VerticalPitch>
    </PitchStage>
  );
}

export interface Palette {
  name: string;
  card: string;
  text: string;
  muted: string;
  vars: CSSProperties;
  spain: string;
  england: string;
}

/**
 * The four palettes from /docs/styling/palettes (apps/docs/app/globals.css
 * `@theme` block) — here as plain CSS variables instead of Tailwind classes.
 */
export const PALETTES: Palette[] = [
  {
    name: "Newsprint",
    card: "#f4efe6",
    text: "#1f1f1f",
    muted: "#6b645b",
    vars: {
      "--pitch-surface": "#f4efe6",
      "--pitch-stripe": "#ede6da",
      "--pitch-lines": "#8a8074",
      "--pitch-line-width": "1.5",
    } as CSSProperties,
    spain: "#c1121f",
    england: "#1d3557",
  },
  {
    name: "Analyst navy",
    card: "#0d1f2b",
    text: "#e2e8f0",
    muted: "#94a3b8",
    vars: {
      "--pitch-surface": "#122c3d",
      "--pitch-stripe": "#163447",
      "--pitch-lines": "#cfcfcf",
      "--pitch-line-width": "1.5",
    } as CSSProperties,
    spain: "#f97316",
    england: "#7dd3fc",
  },
  {
    name: "Dracula",
    card: "#21222c",
    text: "#f8f8f2",
    muted: "#6272a4",
    vars: {
      "--pitch-surface": "#282a36",
      "--pitch-stripe": "#2f3242",
      "--pitch-lines": "#6272a4",
      "--pitch-line-width": "2",
    } as CSSProperties,
    spain: "#ff79c6",
    england: "#8be9fd",
  },
  {
    name: "Gruvbox",
    card: "#1d2021",
    text: "#ebdbb2",
    muted: "#a89984",
    vars: {
      "--pitch-surface": "#282828",
      "--pitch-stripe": "#32302f",
      "--pitch-lines": "#a89984",
      "--pitch-line-width": "2",
    } as CSSProperties,
    spain: "#fb4934",
    england: "#fabd2f",
  },
];

/** StatsBomb records every shot attacking left to right; mirror England to face the other way. */
const mirrored = (s: Shot): Shot => ({ ...s, x: 120 - s.x, y: 80 - s.y });

/** Both teams' shots from the final on a full pitch, in a given palette. */
export function PaletteShotMap({
  palette,
  width,
  scale = 0.55,
  orientation = "horizontal",
}: {
  palette: Palette;
  width: number;
  scale?: number;
  orientation?: Orientation;
}) {
  const spain = finalShots.filter((s) => s.team === "Spain");
  const england = finalShots.filter((s) => s.team === "England").map(mirrored);
  const team = (data: Shot[], color: string, cardBg: string) => (
    <>
      <Scatter
        data={data.filter((s) => !s.goal)}
        x={(s) => s.x}
        y={(s) => s.y}
        r={(s) => shotRadius(s.xg, scale)}
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth={1.5}
      />
      <Scatter
        data={data.filter((s) => s.goal)}
        x={(s) => s.x}
        y={(s) => s.y}
        r={(s) => shotRadius(s.xg, scale)}
        fill={color}
        stroke={cardBg}
        strokeWidth={2}
      />
    </>
  );
  const pitch = (w: number) => (
    <div style={palette.vars}>
      <Pitch
        type="statsbomb"
        width={w}
        height={pitchHeightFor(w)}
        padding={PAD}
        appearance={appearance}
      >
        {team(spain, palette.spain, palette.card)}
        {team(england, palette.england, palette.card)}
      </Pitch>
    </div>
  );
  if (orientation === "vertical") {
    const h = verticalPitchHeightFor(width);
    return (
      <Upright width={pitchHeightFor(h)} height={h}>
        {pitch(h)}
      </Upright>
    );
  }
  return pitch(width);
}

/* ------------------------------------------------------------------------ */
/* Goal chains                                                               */
/* ------------------------------------------------------------------------ */

/**
 * A goal's build-up: passes as arrows, carries as comet trails, the shot as
 * a marker. `progress` (0..moves.length + 1) draws it in move by move for
 * reels; leave it unset for the finished chart.
 */
export function GoalChainChart({
  chain,
  width,
  progress = Infinity,
  showFreezeFrame = false,
  showLabels = true,
  goalPop = 1,
}: {
  chain: GoalChain;
  width: number;
  progress?: number;
  showFreezeFrame?: boolean;
  showLabels?: boolean;
  goalPop?: number;
}) {
  const height = pitchHeightFor(width);
  const s = width / 1000;
  const drawn = chain.moves
    .map((m, i) => ({ m, t: Math.min(Math.max(progress - i, 0), 1) }))
    .filter(({ t }) => t > 0)
    .map(({ m, t }): Move => ({
      ...m,
      endX: m.x + (m.endX - m.x) * t,
      endY: m.y + (m.endY - m.y) * t,
    }));
  const passes = drawn.filter((m) => m.kind === "pass");
  const carries = drawn.filter(
    (m) => m.kind === "carry" && Math.hypot(m.endX - m.x, m.endY - m.y) > 0.5,
  );
  const done = progress >= chain.moves.length;
  const shotT = Math.min(Math.max(progress - chain.moves.length, 0), 1);
  const shot = {
    ...chain.goal,
    endX: chain.goal.x + (chain.goal.endX - chain.goal.x) * shotT,
    endY: chain.goal.y + (chain.goal.endY - chain.goal.y) * shotT,
  };
  const origins = chain.moves.filter((m, i) => m.kind === "pass" && progress > i);

  return (
    <PitchStage labelSize={24 * s}>
      <Pitch type="statsbomb" width={width} height={height} padding={PAD} appearance={appearance}>
        {showFreezeFrame && (
          <>
            <GoalAngle
              data={[chain.goal]}
              x={(g) => g.x}
              y={(g) => g.y}
              goal="right"
              fill={C.orange}
              fillOpacity={0.16}
              stroke="rgba(255,255,255,0.3)"
            />
            <Scatter
              data={chain.freezeFrame}
              x={(p) => p.x}
              y={(p) => p.y}
              r={9 * s}
              fill={(p) => (p.teammate ? C.spain : "#e2e8f0")}
              fillOpacity={(p) => (p.teammate ? 0.9 : 0.75)}
              stroke={(p) => (p.position === "Goalkeeper" ? C.orange : "rgba(6,16,11,0.9)")}
              strokeWidth={(p) => (p.position === "Goalkeeper" ? 3 : 1.5)}
            />
          </>
        )}
        <Comet
          data={carries}
          x={(m) => m.x}
          y={(m) => m.y}
          x2={(m) => m.endX}
          y2={(m) => m.endY}
          color={C.emerald}
          gradient
          endWidth={10 * s}
        />
        <Arrows
          data={passes}
          x={(m) => m.x}
          y={(m) => m.y}
          x2={(m) => m.endX}
          y2={(m) => m.endY}
          stroke="white"
          strokeWidth={4 * s}
          strokeOpacity={0.92}
          headSize={16 * s}
        />
        <Scatter
          data={origins}
          x={(m) => m.x}
          y={(m) => m.y}
          r={7 * s}
          fill="white"
          stroke="rgba(6,16,11,0.9)"
          strokeWidth={2}
        />
        {done && shotT > 0 && (
          <Arrows
            data={[shot]}
            x={(g) => g.x}
            y={(g) => g.y}
            x2={(g) => g.endX}
            y2={(g) => g.endY}
            stroke={C.orange}
            strokeWidth={4 * s}
            headSize={16 * s}
          />
        )}
        {done && (
          <Scatter
            data={[chain.goal]}
            x={(g) => g.x}
            y={(g) => g.y}
            r={13 * s * goalPop}
            fill={C.orange}
            stroke="white"
            strokeWidth={3}
          />
        )}
        {done && showLabels && goalPop > 0.5 && (
          <Annotate
            data={[chain.goal]}
            x={(g) => g.x}
            y={(g) => g.y}
            label={() => `${surname(chain.scorer)} · ${chain.xg.toFixed(2)} xG`}
            // The goal sits near the byline; pull the label back onto the pitch.
            offsetX={-120 * s}
            offsetY={-34 * s}
          />
        )}
      </Pitch>
    </PitchStage>
  );
}

/* ------------------------------------------------------------------------ */
/* Pass network                                                              */
/* ------------------------------------------------------------------------ */

const nodeById = new Map(spainNetwork.nodes.map((n) => [n.id, n]));
const node = (id: number) => {
  const n = nodeById.get(id);
  if (!n) throw new Error(`Unknown node ${id}`);
  return n;
};

export function PassNetworkChart({
  width,
  reveal = 1,
  color = C.emerald,
}: {
  width: number;
  reveal?: number;
  color?: string;
}) {
  const height = pitchHeightFor(width);
  const s = width / 1000;
  const maxCount = Math.max(...spainNetwork.edges.map((e) => e.count));
  const edges = spainNetwork.edges
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.ceil(spainNetwork.edges.length * reveal));
  return (
    <PitchStage labelSize={21 * s}>
      <Pitch type="statsbomb" width={width} height={height} padding={PAD} appearance={appearance}>
        <Arrows
          data={edges}
          x={(e) => node(e.from).x}
          y={(e) => node(e.from).y}
          x2={(e) => node(e.to).x}
          y2={(e) => node(e.to).y}
          stroke={color}
          strokeWidth={(e) => (1.5 + (e.count / maxCount) * 12) * s}
          strokeOpacity={(e) => 0.25 + (e.count / maxCount) * 0.65}
          headSize={0}
        />
        <Scatter
          data={spainNetwork.nodes}
          x={(n) => n.x}
          y={(n) => n.y}
          r={(n) => (10 + n.touches / 4.5) * s * Math.min(reveal * 2, 1)}
          fill={C.bg}
          stroke={color}
          strokeWidth={3.5 * s}
        />
        <Annotate
          data={spainNetwork.nodes}
          x={(n) => n.x}
          y={(n) => n.y}
          label={(n) => String(n.jersey)}
          offsetY={8 * s}
        />
      </Pitch>
    </PitchStage>
  );
}

/* ------------------------------------------------------------------------ */
/* Layer catalogue — one small chart per component                           */
/* ------------------------------------------------------------------------ */

const completePasses = spainPasses.filter((p) => p.complete);
const finalThirdEntries = completePasses.filter((p) => p.x < 80 && p.endX >= 80);
const oyarzabalFrame = oyarzabalGoal.freezeFrame;

export interface LayerDemo {
  /** The component name, shown as `<Name>`. */
  name: string;
  /** What the demo plots — one line. */
  what: string;
  density?: boolean;
  render: (scale: number) => ReactNode;
}

/**
 * One demo per layer component, all on the Euro 2024 final. The montage reel
 * and the catalogue post both draw from this list.
 */
export const LAYER_DEMOS: LayerDemo[] = [
  {
    name: "Scatter",
    what: "Every shot, sized by xG",
    render: (s) => (
      <>
        <Scatter
          data={finalShots.filter((x) => x.team === "Spain")}
          x={(x) => x.x}
          y={(x) => x.y}
          r={(x) => shotRadius(x.xg, s * 0.8)}
          fill={(x) => (x.goal ? C.orange : C.sky)}
          fillOpacity={(x) => (x.goal ? 1 : 0.6)}
          stroke="white"
          strokeWidth={1.5}
        />
      </>
    ),
  },
  {
    name: "Arrows",
    what: "Passes into the final third",
    render: (s) => (
      <Arrows
        data={finalThirdEntries}
        x={(p) => p.x}
        y={(p) => p.y}
        x2={(p) => p.endX}
        y2={(p) => p.endY}
        stroke="white"
        strokeWidth={2.2 * s}
        strokeOpacity={0.8}
        headSize={9 * s}
      />
    ),
  },
  {
    name: "Comet",
    what: "Every carry over 5 yards",
    render: (s) => (
      <Comet
        data={spainCarries}
        x={(c) => c.x}
        y={(c) => c.y}
        x2={(c) => c.endX}
        y2={(c) => c.endY}
        color={C.emerald}
        gradient
        endWidth={6 * s}
      />
    ),
  },
  {
    name: "Heatmap",
    what: "Where Spain passed from",
    density: true,
    render: () => (
      <Heatmap
        data={spainPasses}
        x={(p) => p.x}
        y={(p) => p.y}
        binsX={12}
        binsY={8}
        colorMin="#0f3d24"
        colorMax="#fbbf24"
      />
    ),
  },
  {
    name: "Hexbin",
    what: "The same passes, hex-binned",
    density: true,
    render: (s) => (
      <Hexbin
        data={spainPasses}
        x={(p) => p.x}
        y={(p) => p.y}
        binsX={16}
        colorMin="#0f3d24"
        colorMax={C.emerald}
        stroke="rgba(6,16,11,0.6)"
        strokeWidth={1.5 * s}
      />
    ),
  },
  {
    name: "KDE",
    what: "Lamine Yamal's touches",
    density: true,
    render: () => (
      <KDE
        data={yamalTouches}
        x={(p) => p.x}
        y={(p) => p.y}
        resolution={140}
        colorMin="#0f3d24"
        colorMax="#f472b6"
        maxOpacity={0.95}
      />
    ),
  },
  {
    name: "PositionalHeatmap",
    what: "Juego de Posición zones",
    density: true,
    render: (s) => (
      <PositionalHeatmap
        data={spainPasses}
        x={(p) => p.x}
        y={(p) => p.y}
        colorMin="#0f3d24"
        colorMax={C.sky}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.2 * s}
      />
    ),
  },
  {
    name: "Flow",
    what: "Average pass direction per zone",
    render: (s) => (
      <Flow
        data={completePasses}
        x={(p) => p.x}
        y={(p) => p.y}
        x2={(p) => p.endX}
        y2={(p) => p.endY}
        binsX={6}
        binsY={4}
        colorMin="#5f7d6d"
        colorMax={C.emerald}
        strokeWidthMin={2 * s}
        strokeWidthMax={7 * s}
      />
    ),
  },
  {
    name: "Voronoi",
    what: "Space at the winning goal",
    render: (s) => (
      <>
        <Voronoi
          data={oyarzabalFrame}
          x={(p) => p.x}
          y={(p) => p.y}
          fill={(p) => (p.teammate ? C.spain : "#e2e8f0")}
          fillOpacity={0.22}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1.2 * s}
        />
        <Scatter
          data={oyarzabalFrame}
          x={(p) => p.x}
          y={(p) => p.y}
          r={6 * s}
          fill={(p) => (p.teammate ? C.spain : "#e2e8f0")}
          stroke="rgba(6,16,11,0.8)"
          strokeWidth={1.2}
        />
      </>
    ),
  },
  {
    name: "ConvexHull",
    what: "Yamal's area of influence",
    render: (s) => (
      <>
        <ConvexHull
          data={yamalTouches}
          x={(p) => p.x}
          y={(p) => p.y}
          fill="#f472b6"
          fillOpacity={0.18}
          stroke="#f472b6"
          strokeWidth={2.5 * s}
        />
        <Scatter
          data={yamalTouches}
          x={(p) => p.x}
          y={(p) => p.y}
          r={3.5 * s}
          fill="#f472b6"
          fillOpacity={0.85}
        />
      </>
    ),
  },
  {
    name: "GoalAngle",
    what: "Oyarzabal's view of goal",
    render: (s) => (
      <>
        <GoalAngle
          data={[oyarzabalGoal.goal]}
          x={(g) => g.x}
          y={(g) => g.y}
          goal="right"
          fill={C.orange}
          fillOpacity={0.3}
          stroke={C.orange}
          strokeWidth={1.5 * s}
        />
        <Scatter
          data={[oyarzabalGoal.goal]}
          x={(g) => g.x}
          y={(g) => g.y}
          r={9 * s}
          fill={C.orange}
          stroke="white"
          strokeWidth={2}
        />
      </>
    ),
  },
];

/** Render one catalogue entry on its own pitch. */
export function LayerDemoChart({
  demo,
  width,
  orientation = "horizontal",
}: {
  demo: LayerDemo;
  width: number;
  orientation?: Orientation;
}) {
  const w = orientation === "vertical" ? verticalPitchHeightFor(width) : width;
  const s = w / 1000;
  const chart = (
    <PitchStage>
      <Pitch
        type="statsbomb"
        width={w}
        height={pitchHeightFor(w)}
        padding={PAD}
        appearance={demo.density ? densityAppearance : appearance}
      >
        {demo.render(s)}
      </Pitch>
    </PitchStage>
  );
  return orientation === "vertical" ? (
    <Upright width={pitchHeightFor(w)} height={w}>
      {chart}
    </Upright>
  ) : (
    chart
  );
}

export { cropForHalf };
