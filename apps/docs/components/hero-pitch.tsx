"use client";

import { useCallback, useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { getPitchDimensions } from "@pitchkit/core";
import type { PitchTypeId } from "@pitchkit/core";
import { Comet, GoalAngle, Pitch, Scatter, usePitch } from "@pitchkit/react";

/**
 * The landing hero: a live, touchable pitch. Clicking (or tapping) plots a
 * passing move — each new point extends a comet trail — while a
 * broadcast-style readout tracks the cursor in *provider* coordinates, and
 * the pitch-type switcher re-renders the same move under a different
 * provider's coordinate system. The point is to demonstrate, in ten
 * seconds of poking, the three things PitchKit actually sells: responsive
 * rendering, provider-agnostic coordinates, and composable layers.
 *
 * Plotted points are stored as *physical* fractions of the viewport (not
 * provider coordinates), so they stay pinned to the same spot on the grass
 * when the container resizes or the provider (and its whole coordinate
 * system, y-direction included) changes underneath them; each render maps
 * them back through `transform.toProvider` — the same inverse transform a
 * real app would use to ingest click/tracking input.
 */

interface FractionPoint {
  fx: number;
  fy: number;
}

// The preset move: a build-up from the keeper to a strike from just outside
// the box, in physical fractions of the (horizontal) pitch.
const PRESET_MOVE: FractionPoint[] = [
  { fx: 0.09, fy: 0.52 },
  { fx: 0.24, fy: 0.18 },
  { fx: 0.45, fy: 0.55 },
  { fx: 0.66, fy: 0.22 },
  { fx: 0.78, fy: 0.58 },
  { fx: 0.87, fy: 0.42 },
];

const PITCH_TYPES: { id: PitchTypeId; label: string; size: string }[] = [
  { id: "statsbomb", label: "StatsBomb", size: "120 × 80" },
  { id: "skillcorner", label: "SkillCorner", size: "105 × 68" },
];

interface HeroLayersProps {
  points: FractionPoint[];
  onAddPoint: (point: FractionPoint) => void;
  onCursor: (position: readonly [number, number] | null) => void;
}

/**
 * Lives *inside* `<Pitch>` so it can read the pixel transform from context
 * via `usePitch()` — the documented escape hatch for exactly this kind of
 * custom coordinate math.
 */
function HeroLayers({ points, onAddPoint, onCursor }: HeroLayersProps) {
  const { transform, viewport } = usePitch();

  const providerPoints = points.map((p) =>
    transform.toProvider([p.fx * viewport.width, p.fy * viewport.height]),
  );
  const segments = providerPoints.slice(1).map((to, i) => ({ from: providerPoints[i]!, to }));
  const last = providerPoints[providerPoints.length - 1];

  // Event coordinates -> the SVG viewBox's pixel space (the space
  // `toProvider` inverts). The viewBox is `0 0 viewport.width
  // viewport.height`, so it's a straight rescale from the client rect.
  const toViewportPx = (e: ReactPointerEvent<SVGRectElement>): [number, number] => {
    const rect = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) / rect.width) * viewport.width,
      ((e.clientY - rect.top) / rect.height) * viewport.height,
    ];
  };

  return (
    <>
      {last && <GoalAngle data={[last]} x={(p) => p[0]} y={(p) => p[1]} />}
      <Comet
        data={segments}
        x={(s) => s.from[0]}
        y={(s) => s.from[1]}
        x2={(s) => s.to[0]}
        y2={(s) => s.to[1]}
        gradient
      />
      <Scatter
        data={providerPoints}
        x={(p) => p[0]}
        y={(p) => p[1]}
        r={(_, i) => (i === providerPoints.length - 1 ? 6 : 4.5)}
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth={1.5}
      />
      {/* Invisible capture surface, stacked last so it sits on top. */}
      <rect
        width="100%"
        height="100%"
        fill="transparent"
        style={{ cursor: "crosshair", touchAction: "manipulation" }}
        onClick={(e) => {
          const [px, py] = toViewportPx(e as unknown as ReactPointerEvent<SVGRectElement>);
          onAddPoint({ fx: px / viewport.width, fy: py / viewport.height });
        }}
        onPointerMove={(e) => onCursor(transform.toProvider(toViewportPx(e)))}
        onPointerLeave={() => onCursor(null)}
      />
    </>
  );
}

export function HeroPitch() {
  const [pitchType, setPitchType] = useState<PitchTypeId>("statsbomb");
  const [points, setPoints] = useState<FractionPoint[]>([]);
  const [cursor, setCursor] = useState<readonly [number, number] | null>(null);
  const [touched, setTouched] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    let step = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const timeoutId = setTimeout(() => {
      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        setPoints(PRESET_MOVE);
        setAnimationComplete(true);
        return;
      }

      step = 1;
      setPoints(PRESET_MOVE.slice(0, 1));

      intervalId = setInterval(() => {
        step++;
        if (step <= PRESET_MOVE.length) {
          setPoints(PRESET_MOVE.slice(0, step));
        }
        if (step >= PRESET_MOVE.length) {
          if (intervalId) clearInterval(intervalId);
          setAnimationComplete(true);
        }
      }, 350);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const addPoint = useCallback((point: FractionPoint) => {
    setTouched(true);
    setAnimationComplete(true);
    setPoints((prev) => [...prev, point]);
  }, []);

  const dimensions = getPitchDimensions(pitchType);

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between gap-2 pb-3">
        <div className="flex gap-1.5" role="group" aria-label="Pitch coordinate provider">
          {PITCH_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPitchType(t.id)}
              aria-pressed={pitchType === t.id}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                pitchType === t.id
                  ? "border-fd-primary/50 bg-fd-primary/10 text-fd-primary"
                  : "border-fd-border text-fd-muted-foreground hover:text-fd-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setPoints(PRESET_MOVE);
            setTouched(false);
            setAnimationComplete(true);
          }}
          className={`rounded-md px-2 py-1 text-xs text-fd-muted-foreground transition-all duration-500 hover:text-fd-foreground ${
            animationComplete ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          Reset
        </button>
      </div>

      <div className="pitchkit-hero-pitch relative overflow-hidden rounded-xl border border-fd-border shadow-lg">
        <Pitch
          type={pitchType}
          appearance={{ stripes: true, goalType: "box" }}
          aria-label="Interactive demo pitch — click to plot a passing move"
        >
          <HeroLayers points={points} onAddPoint={addPoint} onCursor={setCursor} />
        </Pitch>

        {/* Broadcast-style coordinate readout (score-bug treatment). */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 font-mono text-[11px] text-white/90 backdrop-blur-sm">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="uppercase tracking-wider text-white/50">{pitchType}</span>
          <span className="tabular-nums">
            {cursor
              ? `x ${cursor[0].toFixed(1)} · y ${cursor[1].toFixed(1)}`
              : `${dimensions.length} × ${dimensions.width}`}
          </span>
        </div>
      </div>

      <p
        className={`pt-3 text-center text-xs text-fd-muted-foreground transition-opacity duration-500 ${
          animationComplete ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        {touched
          ? "Same move, any provider — switch coordinate systems above."
          : "Click anywhere to extend the move. The readout tracks provider coordinates."}
      </p>
    </div>
  );
}
