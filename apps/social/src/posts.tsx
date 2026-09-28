/**
 * The six wall posts (1080 x 1350). Designed as one 2 x 3 grid block: each
 * stands alone, and together they walk from "what is this" to "how much is
 * in it".
 */
import type { CSSProperties } from "react";
import { Scatter, VerticalPitch } from "@pitchkit/react";
import {
  GoalChainChart,
  LAYER_DEMOS,
  LayerDemoChart,
  PALETTES,
  PaletteShotMap,
  PassNetworkChart,
  STATSBOMB,
  cropForHalf,
  shotRadius,
} from "./charts";
import { Code } from "./components/Code";
import { InstallPill, Key, PitchStage, PostFrame, Tag } from "./components/Chrome";
import { finalShots, oyarzabalGoal, spainNetwork, surname } from "./data";
import { appearance, C, FONT, PAD_V } from "./theme";

/* 01 — Hello ------------------------------------------------------------- */

export function PostIntro() {
  return (
    <PostFrame
      index={1}
      eyebrow="Open source · MIT · React + TypeScript"
      headline={
        <>
          Football visualised
          <br />
          for the <span style={{ color: C.emerald }}>web.</span>
        </>
      }
      sub="mplsoccer's pitch charts, rebuilt as React components. Shot maps, pass networks, heatmaps, tracking data — in the browser."
      credit="Spain's pass network · Euro 2024 final · StatsBomb open data"
      headlineSize={84}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
        <PassNetworkChart width={960} />
        <InstallPill />
      </div>
    </PostFrame>
  );
}

/* 02 — Code → chart ------------------------------------------------------ */

export const SHOT_MAP_CODE = `import { VerticalPitch, Scatter } from "@pitchkit/react";
import { cropForHalf, getPitchDimensions } from "@pitchkit/core";
import { fetchMatchEvents, shots, isGoal }
  from "@pitchkit/data-providers/statsbomb";

const events = await fetchMatchEvents(3943043);
const spain = shots(events).filter((s) => s.team.name === "Spain");
const half = cropForHalf(getPitchDimensions("statsbomb"));

<VerticalPitch type="statsbomb" crop={half}>
  <Scatter data={spain} x={(s) => s.x} y={(s) => s.y} stroke="white"
    r={(s) => 5 + Math.sqrt(s.shot.statsbomb_xg) * 26}
    fill={(s) => (isGoal(s) ? "#fb923c" : "#38bdf8")} />
</VerticalPitch>`;

/** Exactly what SHOT_MAP_CODE draws — no extra layers. */
function SnippetShotMap({ width, height }: { width: number; height: number }) {
  const spain = finalShots.filter((s) => s.team === "Spain");
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
        <Scatter
          data={spain}
          x={(s) => s.x}
          y={(s) => s.y}
          stroke="white"
          r={(s) => shotRadius(s.xg, width / 700)}
          fill={(s) => (s.goal ? C.orange : C.sky)}
        />
      </VerticalPitch>
    </PitchStage>
  );
}

export function PostCode() {
  const spain = finalShots.filter((s) => s.team === "Spain");
  const xg = spain.reduce((t, s) => t + s.xg, 0);
  const stat = (value: string, label: string, color: string = C.text) => (
    <div>
      <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.03em", color }}>{value}</div>
      <div style={{ fontSize: 22, color: C.muted, fontFamily: FONT.mono }}>{label}</div>
    </div>
  );
  return (
    <PostFrame
      index={2}
      eyebrow="Match ID → chart"
      headline="A real shot map in 14 lines."
      credit="Spain's shots · Euro 2024 final · StatsBomb open data"
      headlineSize={68}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 30, width: "100%" }}>
        <Code code={SHOT_MAP_CODE} size={18.5} title="ShotMap.tsx" />
        <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
          <SnippetShotMap width={540} height={435} />
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            {stat(String(spain.length), "shots")}
            {stat(xg.toFixed(2), "xG")}
            {stat(String(spain.filter((s) => s.goal).length), "goals", C.orange)}
          </div>
        </div>
      </div>
    </PostFrame>
  );
}

/* 03 — The winner -------------------------------------------------------- */

export function PostWinner() {
  const g = oyarzabalGoal;
  return (
    <PostFrame
      index={3}
      eyebrow={`${g.minute + 1}' · Spain 2–1 England`}
      headline={
        <>
          The winner, <span style={{ color: C.orange }}>frozen.</span>
        </>
      }
      sub={`${g.moves.length} actions from Spain's half to the net — and where every player StatsBomb saw was standing when ${surname(g.scorer)} struck it.`}
      credit="StatsBomb open data · Euro 2024 final"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "center" }}>
        <GoalChainChart chain={g} width={960} showFreezeFrame />
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center" }}>
          <Key color="white" label="Pass" />
          <Key color={C.emerald} label="Carry" />
          <Key color={C.spain} label="Spain" />
          <Key color="#e2e8f0" label="England" />
          <Key color={C.orange} label="Keeper · shot" hollow />
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["<Arrows>", "<Comet>", "<Scatter>", "<GoalAngle>"].map((t) => (
            <Tag key={t} size={22}>
              {t}
            </Tag>
          ))}
        </div>
      </div>
    </PostFrame>
  );
}

/* 04 — Pass network ------------------------------------------------------ */

export function PostNetwork() {
  const nodes = spainNetwork.nodes.slice().sort((a, b) => a.jersey - b.jersey);
  return (
    <PostFrame
      index={4}
      eyebrow="Pass network · Spain"
      headline="How Spain moved the ball."
      sub={`Euro 2024 final, first ${spainNetwork.minutes} minutes. Circle = involvement, line = completed passes between the pair.`}
      credit="StatsBomb open data · <Scatter> + <Arrows> + <Annotate>"
      headlineSize={72}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <PassNetworkChart width={960} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            rowGap: 10,
            columnGap: 18,
            fontSize: 21,
            color: C.muted,
          }}
        >
          {nodes.map((n) => (
            <span key={n.id} style={{ whiteSpace: "nowrap" }}>
              <span style={{ fontFamily: FONT.mono, color: C.emerald, fontWeight: 600 }}>
                {String(n.jersey).padStart(2, " ")}
              </span>{" "}
              {n.label}
            </span>
          ))}
        </div>
      </div>
    </PostFrame>
  );
}

/* 05 — Palettes ---------------------------------------------------------- */

export function PostPalettes() {
  return (
    <PostFrame
      index={5}
      eyebrow="Theming"
      headline="One chart. Four looks."
      sub="Every shot from the final. Theming is CSS variables — or Tailwind classes. No JS theme objects."
      credit="StatsBomb open data · Euro 2024 final"
      headlineSize={72}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, width: "100%" }}>
        {PALETTES.map((p) => (
          <div
            key={p.name}
            style={{
              background: p.card,
              color: p.text,
              borderRadius: 22,
              padding: "20px 20px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
            >
              <span style={{ fontSize: 26, fontWeight: 700 }}>{p.name}</span>
              <span style={{ fontSize: 22, fontWeight: 700 }}>
                <span style={{ color: p.spain }}>ESP 2</span>
                <span style={{ color: p.muted }}> – </span>
                <span style={{ color: p.england }}>1 ENG</span>
              </span>
            </div>
            <PaletteShotMap palette={p} width={429} />
          </div>
        ))}
      </div>
    </PostFrame>
  );
}

/* 06 — Layer catalogue --------------------------------------------------- */

const GRID_LAYERS = [
  "Scatter",
  "Arrows",
  "Comet",
  "Heatmap",
  "Hexbin",
  "KDE",
  "Flow",
  "Voronoi",
  "ConvexHull",
];

export function PostLayers() {
  const demos = GRID_LAYERS.map((name) => {
    const demo = LAYER_DEMOS.find((d) => d.name === name);
    if (!demo) throw new Error(`No demo for ${name}`);
    return demo;
  });
  const thin = { "--pitch-line-width": "1.25" } as CSSProperties;
  return (
    <PostFrame
      index={6}
      eyebrow="What's in the box"
      headline={
        <>
          13 layers. One{" "}
          <span style={{ fontFamily: FONT.mono, color: C.emerald, letterSpacing: "-0.04em" }}>
            &lt;Pitch&gt;
          </span>
          .
        </>
      }
      sub="Every chart below is one component on one match — Spain v England, Euro 2024 final."
      credit="StatsBomb open data"
      headlineSize={72}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px 18px" }}>
        {demos.map((d) => (
          <div key={d.name} style={{ display: "flex", flexDirection: "column", gap: 10, ...thin }}>
            <LayerDemoChart demo={d} width={306} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{ fontFamily: FONT.mono, fontSize: 21, fontWeight: 600, color: C.emerald }}
              >
                &lt;{d.name}&gt;
              </span>
              <span style={{ fontSize: 17, color: C.muted }}>{d.what}</span>
            </div>
          </div>
        ))}
      </div>
    </PostFrame>
  );
}
