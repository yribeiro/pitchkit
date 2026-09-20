"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { Arrows, GoalAngle, Pitch, Scatter, Voronoi, usePitch } from "@pitchkit/react";

/**
 * The landing hero: a tabbed carousel of three real gallery visualisations
 * — shot map, pass network, voronoi — that advances itself every five
 * seconds behind a countdown bar (pausable from the pitch's bottom-left
 * corner), with a "Browse the gallery" CTA in the top-right. It replaces
 * the earlier click-to-plot toy pitch: what sells
 * the library is the finished charts you can build with it, and every tab
 * doubles as a funnel into /gallery where the source for each is on show.
 *
 * The data mirrors the corresponding gallery entries
 * (`components/examples/*-gallery.tsx`), but each visual is re-drawn here
 * on a full **horizontal** 120 x 80 StatsBomb pitch so all three tabs share
 * one frame — the gallery's shot map uses a vertical half-pitch, which
 * would make the hero box jump from wide to tall on every tab change.
 * Colours are the hero's darker broadcast palette (see
 * `.pitchkit-hero-showcase` in globals.css), not the docs example theme.
 */

const ACCENT = "#34d399";
const CONTRAST = "#fb923c";

// ---------------------------------------------------------------- shot map

// StatsBomb coordinates (120 x 80). One team's shots from a match:
// location, xG, and outcome.
const shots = [
  { x: 112, y: 39, xg: 0.76, outcome: "goal" },
  { x: 105, y: 44, xg: 0.31, outcome: "saved" },
  { x: 108, y: 33, xg: 0.44, outcome: "goal" },
  { x: 99, y: 47, xg: 0.13, outcome: "off target" },
  { x: 102, y: 36, xg: 0.24, outcome: "blocked" },
  { x: 95, y: 40, xg: 0.09, outcome: "saved" },
  { x: 110, y: 46, xg: 0.52, outcome: "saved" },
  { x: 91, y: 29, xg: 0.06, outcome: "off target" },
  { x: 104, y: 26, xg: 0.17, outcome: "blocked" },
  { x: 87, y: 43, xg: 0.05, outcome: "off target" },
  { x: 107, y: 41, xg: 0.38, outcome: "saved" },
  { x: 97, y: 55, xg: 0.08, outcome: "blocked" },
];

const bestChance = shots.reduce((a, b) => (b.xg > a.xg ? b : a));

/**
 * Reads which shot the pointer is over from the event that bubbled out of
 * `<Scatter>`. The alternative — a transparent hit layer of our own on top
 * — would swallow the events `<Scatter>` needs for its tooltip, and
 * `usePitch()` deliberately doesn't hand out `setTooltip`, so we'd have to
 * reimplement the tooltip to get the highlight. Instead this leans on the
 * `data-pitchkit-mark` attribute the library stamps on every mark for
 * exactly this kind of targeting; `<Scatter>` renders one `<circle>` per
 * datum in order, so the child index is the datum index.
 */
function shotIndexFromEvent(event: MouseEvent<SVGGElement>): number | null {
  const mark = (event.target as Element).closest?.('[data-pitchkit-mark="scatter"]');
  const siblings = mark?.parentElement?.children;
  if (!mark || !siblings) return null;
  const index = Array.prototype.indexOf.call(siblings, mark);
  return index >= 0 && index < shots.length ? index : null;
}

function HeroShotMap() {
  const [hovered, setHovered] = useState<number | null>(null);
  // The wedge is part of the resting composition (drawn for the best
  // chance), and follows the pointer once there is one.
  const focus = hovered === null ? bestChance : shots[hovered]!;
  const dimmed = (i: number) => hovered !== null && hovered !== i;

  return (
    <>
      <GoalAngle
        data={[focus]}
        x={(s) => s.x}
        y={(s) => s.y}
        fillOpacity={hovered === null ? 0.12 : 0.24}
        stroke={hovered === null ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 255, 255, 0.6)"}
      />
      <g
        onMouseOver={(e) => setHovered(shotIndexFromEvent(e))}
        onMouseLeave={() => setHovered(null)}
      >
        <Scatter
          data={shots}
          x={(s) => s.x}
          y={(s) => s.y}
          r={(s) => 3 + s.xg * 9}
          fill={(s) => (s.outcome === "goal" ? CONTRAST : ACCENT)}
          fillOpacity={(s, i) => (dimmed(i) ? 0.12 : s.outcome === "goal" ? 0.95 : 0.6)}
          stroke={(_, i) => (dimmed(i) ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.9)")}
          strokeWidth={(s) => (s.outcome === "goal" ? 2 : 1)}
          tooltip={(s) => `${s.outcome} · xG ${s.xg.toFixed(2)}`}
          className="pitchkit-hero-showcase__shot"
        />
      </g>
    </>
  );
}

// ------------------------------------------------------------ pass network

// Average positions plus pass counts between player pairs.
const players = [
  { id: "GK", x: 10, y: 40, touches: 42 },
  { id: "LB", x: 32, y: 12, touches: 58 },
  { id: "LCB", x: 26, y: 30, touches: 71 },
  { id: "RCB", x: 26, y: 50, touches: 66 },
  { id: "RB", x: 32, y: 68, touches: 49 },
  { id: "DM", x: 44, y: 40, touches: 88 },
  { id: "LCM", x: 58, y: 24, touches: 74 },
  { id: "RCM", x: 58, y: 56, touches: 69 },
  { id: "LW", x: 82, y: 14, touches: 46 },
  { id: "ST", x: 92, y: 40, touches: 38 },
  { id: "RW", x: 82, y: 66, touches: 44 },
];

const byId = Object.fromEntries(players.map((p) => [p.id, p]));

/** Every pass endpoint below references a player id from the list above. */
function node(id: string) {
  const player = byId[id];
  if (!player) throw new Error(`Unknown player id: ${id}`);
  return player;
}

const passes = [
  { from: "GK", to: "LCB", count: 18 },
  { from: "GK", to: "RCB", count: 15 },
  { from: "LCB", to: "LB", count: 21 },
  { from: "RCB", to: "RB", count: 17 },
  { from: "LCB", to: "DM", count: 24 },
  { from: "RCB", to: "DM", count: 19 },
  { from: "DM", to: "LCM", count: 26 },
  { from: "DM", to: "RCM", count: 22 },
  { from: "LB", to: "LCM", count: 14 },
  { from: "RB", to: "RCM", count: 12 },
  { from: "LCM", to: "LW", count: 16 },
  { from: "RCM", to: "RW", count: 13 },
  { from: "LCM", to: "ST", count: 9 },
  { from: "RCM", to: "ST", count: 8 },
  { from: "LW", to: "ST", count: 7 },
  { from: "RW", to: "ST", count: 6 },
];

/**
 * Node radius in pixels — `Scatter` passes `r` straight through as the
 * SVG radius, so this is the same space `transform.toPixel` returns.
 * Shared with PositionLabels, which has to clear the circle it labels.
 */
function nodeRadius(p: (typeof players)[number]) {
  return 4 + p.touches / 12;
}

const NODE_STROKE_WIDTH = 1.5;

function HeroPassNetwork() {
  return (
    <>
      <Arrows
        data={passes}
        x={(p) => node(p.from).x}
        y={(p) => node(p.from).y}
        x2={(p) => node(p.to).x}
        y2={(p) => node(p.to).y}
        strokeWidth={(p) => 0.5 + p.count / 6}
        strokeOpacity={(p) => 0.3 + Math.min(p.count / 30, 0.6)}
        headSize={0}
        tooltip={(p) => `${p.from} → ${p.to}: ${p.count} passes`}
      />
      <Scatter
        data={players}
        x={(p) => p.x}
        y={(p) => p.y}
        r={nodeRadius}
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth={NODE_STROKE_WIDTH}
        tooltip={(p) => `${p.id} · ${p.touches} touches`}
      />
      <PositionLabels />
    </>
  );
}

const LABEL_FONT_SIZE = 9;
const LABEL_PADDING_X = 4;
const LABEL_HEIGHT = 13;
/** Rough advance width per character at LABEL_FONT_SIZE, for the box. */
const LABEL_CHAR_WIDTH = 5.6;
/** Clear air between the top of a node's stroke and the chip beneath it. */
const LABEL_GAP = 4;

/**
 * Position labels as white text on a black chip, which `<Annotate>` can't
 * do — it paints a bare `<text>`, and against a pass network's own nodes
 * and edges the plain glyphs disappear. Rather than widen the library's
 * API for one hero, this drops to `usePitch()` — the documented escape
 * hatch for custom coordinate math — and draws the rect itself.
 */
function PositionLabels() {
  const { transform } = usePitch();

  return (
    <g data-pitchkit-layer="hero-position-labels">
      {players.map((p) => {
        const [px, py] = transform.toPixel([p.x, p.y]);
        // Sits clear of this node's own circle rather than a fixed offset:
        // radii run 7.5 (GK) to 11.3 (DM), so one offset either overlapped
        // the big nodes or floated off the small ones.
        const cy = py - (nodeRadius(p) + NODE_STROKE_WIDTH / 2 + LABEL_GAP + LABEL_HEIGHT / 2);
        const width = p.id.length * LABEL_CHAR_WIDTH + LABEL_PADDING_X * 2;

        return (
          <g key={p.id}>
            <rect
              x={px - width / 2}
              y={cy - LABEL_HEIGHT / 2}
              width={width}
              height={LABEL_HEIGHT}
              rx={2}
              fill="#000"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth={0.75}
            />
            <text
              x={px}
              y={cy}
              fill="#fff"
              fontSize={LABEL_FONT_SIZE}
              fontWeight={500}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {p.id}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ----------------------------------------------------------------- voronoi

type Team = "home" | "away";

// Both full XIs at one frame of play.
const frame: { id: string; team: Team; x: number; y: number }[] = [
  { id: "GK", team: "home", x: 8, y: 40 },
  { id: "LB", team: "home", x: 35, y: 12 },
  { id: "LCB", team: "home", x: 28, y: 31 },
  { id: "RCB", team: "home", x: 28, y: 49 },
  { id: "RB", team: "home", x: 35, y: 68 },
  { id: "DM", team: "home", x: 44, y: 40 },
  { id: "LCM", team: "home", x: 55, y: 25 },
  { id: "RCM", team: "home", x: 55, y: 55 },
  { id: "LW", team: "home", x: 74, y: 14 },
  { id: "ST", team: "home", x: 80, y: 40 },
  { id: "RW", team: "home", x: 74, y: 66 },
  { id: "GK", team: "away", x: 114, y: 40 },
  { id: "LB", team: "away", x: 90, y: 70 },
  { id: "LCB", team: "away", x: 96, y: 51 },
  { id: "RCB", team: "away", x: 96, y: 29 },
  { id: "RB", team: "away", x: 90, y: 10 },
  { id: "DM", team: "away", x: 82, y: 40 },
  { id: "LCM", team: "away", x: 70, y: 52 },
  { id: "RCM", team: "away", x: 70, y: 28 },
  { id: "LW", team: "away", x: 56, y: 65 },
  { id: "ST", team: "away", x: 50, y: 40 },
  { id: "RW", team: "away", x: 56, y: 15 },
];

const TEAM_COLOR: Record<Team, string> = { home: ACCENT, away: CONTRAST };

function HeroVoronoi() {
  return (
    <>
      <Voronoi
        data={frame}
        x={(p) => p.x}
        y={(p) => p.y}
        fill={(p) => TEAM_COLOR[p.team]}
        fillOpacity={0.16}
        stroke="rgba(255, 255, 255, 0.4)"
        tooltip={(p) => `${p.team} ${p.id}`}
      />
      <Scatter
        data={frame}
        x={(p) => p.x}
        y={(p) => p.y}
        r={3.5}
        fill={(p) => TEAM_COLOR[p.team]}
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth={1}
      />
    </>
  );
}

// -------------------------------------------------------------------- tabs

interface Example {
  id: string;
  label: string;
  /** Sits under the pitch: what the chart shows, and what drew it. */
  caption: string;
  /** Announced on the <Pitch> itself. */
  ariaLabel: string;
  Layers: () => React.ReactElement;
}

const EXAMPLES: Example[] = [
  {
    id: "shot-map",
    label: "Shot Map",
    caption: "Markers sized by xG, coloured by outcome — Scatter + GoalAngle.",
    ariaLabel: "Shot map — shots sized by expected goals, coloured by outcome",
    Layers: HeroShotMap,
  },
  {
    id: "pass-network",
    label: "Pass Network",
    caption: "Nodes by touches, edges by pass volume — Arrows + Scatter.",
    ariaLabel: "Pass network — average player positions joined by pass volume",
    Layers: HeroPassNetwork,
  },
  {
    id: "voronoi",
    label: "Voronoi",
    caption: "Who controls which patch of grass, all 22 players — Voronoi.",
    ariaLabel: "Voronoi diagram — pitch control split between both teams",
    Layers: HeroVoronoi,
  },
];

/** How long each visual holds before the carousel advances. */
const CYCLE_MS = 5000;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function reducedMotionNow() {
  return window.matchMedia(REDUCED_MOTION).matches;
}

export function HeroShowcase() {
  const [activeId, setActiveId] = useState(EXAMPLES[0]!.id);
  // Bumped on every tab click. `activeId` alone can't drive the reset:
  // clicking the tab that's already showing sets the same id, React bails
  // out of the re-render, and the countdown would run out mid-look.
  const [restarts, setRestarts] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = EXAMPLES.find((e) => e.id === activeId) ?? EXAMPLES[0]!;
  const { Layers } = active;

  // Auto-advance is motion, so `prefers-reduced-motion` users get a static
  // first tab (and no progress bar) until they pick one themselves.
  // `useSyncExternalStore` rather than an effect: the media query *is* an
  // external store, and it keeps the server snapshot explicit.
  const autoCycle = !useSyncExternalStore(subscribeToReducedMotion, reducedMotionNow, () => false);

  // Keyed on the same values as the progress bar below, so the timer and
  // the bar always restart together. Pausing drops the timer entirely and
  // freezes the bar mid-fill; resuming bumps `restarts`, so both go back
  // to zero rather than the bar resuming from a point the timer has no
  // memory of.
  useEffect(() => {
    if (!autoCycle || paused) return;
    const timeoutId = setTimeout(() => {
      const i = EXAMPLES.findIndex((e) => e.id === activeId);
      setActiveId(EXAMPLES[(i + 1) % EXAMPLES.length]!.id);
    }, CYCLE_MS);
    return () => clearTimeout(timeoutId);
  }, [activeId, restarts, autoCycle, paused]);

  return (
    <div className="w-full min-w-0">
      {/* One row at every width. It only fits on a phone because the CTA
          shortens to "Gallery" below `sm` — see the two spans in it. */}
      <div className="flex items-center justify-between gap-2 pb-3 sm:gap-3">
        <div className="flex gap-1 sm:gap-1.5" role="tablist" aria-label="Example visualisations">
          {EXAMPLES.map((e) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={e.id === activeId}
              aria-controls="hero-showcase-panel"
              onClick={() => {
                setActiveId(e.id);
                setRestarts((n) => n + 1);
              }}
              className={`whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium transition-colors sm:px-2.5 ${
                e.id === activeId
                  ? "border-fd-primary/50 bg-fd-primary/10 text-fd-primary"
                  : "border-fd-border text-fd-muted-foreground hover:text-fd-foreground"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
        <Link
          href="/gallery"
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-fd-primary px-2 py-1.5 text-xs font-medium text-fd-primary-foreground transition-opacity hover:opacity-90 sm:px-2.5"
        >
          <span className="sm:hidden">Gallery</span>
          <span className="hidden sm:inline">Browse the gallery</span>
          <svg
            aria-hidden
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>

      <div
        id="hero-showcase-panel"
        role="tabpanel"
        className="pitchkit-hero-showcase relative overflow-hidden border border-fd-border shadow-lg"
      >
        {/* Keyed on the active example so each tab mounts its own layers
            rather than React reconciling one mark type into another. */}
        <Pitch
          key={active.id}
          type="statsbomb"
          appearance={{ stripes: true, goalType: "box" }}
          aria-label={active.ariaLabel}
        >
          <Layers />
        </Pitch>

        {/* Broadcast-style readout (score-bug treatment). */}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 font-mono text-[11px] text-white/90 backdrop-blur-sm">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="uppercase tracking-wider text-white/50">statsbomb</span>
          <span className="tabular-nums">120 × 80</span>
        </div>

        {/* Carousel controls. Both are hidden outright under reduced
            motion, where there's no cycle to countdown or pause. */}
        {autoCycle && (
          <>
            <button
              type="button"
              onClick={() => {
                setPaused((p) => !p);
                if (paused) setRestarts((n) => n + 1);
              }}
              aria-pressed={paused}
              aria-label={paused ? "Resume cycling examples" : "Pause cycling examples"}
              className="absolute bottom-3 left-3 flex size-7 items-center justify-center rounded-md border border-white/10 bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-white"
            >
              {paused ? (
                <svg aria-hidden width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 1.5v9l7-4.5-7-4.5Z" />
                </svg>
              ) : (
                <svg aria-hidden width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2.5 1.5h2.5v9H2.5v-9ZM7 1.5h2.5v9H7v-9Z" />
                </svg>
              )}
            </button>

            {/* The countdown. A pure CSS animation remounted on the same key
                the timer restarts on, so the two can't drift — no per-frame
                state in React. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/10">
              <div
                key={`${active.id}-${restarts}`}
                className="pitchkit-hero-showcase__progress h-full bg-fd-primary"
                style={{
                  animationDuration: `${CYCLE_MS}ms`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Deliberately not a live region: the carousel rewrites this every
          five seconds, and a polite announcement on that cadence is noise. */}
      <p className="pt-3 text-center text-xs text-fd-muted-foreground">{active.caption}</p>
    </div>
  );
}
