"use client";

import { useState } from "react";
import Link from "next/link";
import { Arrows, Pitch, Scatter } from "@pitchkit/react";
import { CodeBlock } from "@/components/code-block";

/**
 * The homepage "Styling" section: one chart, re-themed live by swapping
 * nothing but Tailwind classes. Every theme below is three class strings —
 * one on `<Pitch>` (the `pitch-*` utilities from the `@utility` recipe in
 * globals.css, which set the `--pitch-*` variables) and one on each mark
 * (ordinary `fill-*`/`stroke-*` utilities, which take over from the themed
 * default once `className` is passed). No JS theme object anywhere — that
 * is the point being shown.
 *
 * Every class string is a complete literal in this file, never assembled
 * from parts: Tailwind generates CSS only for class names it can find
 * verbatim in source, so `pitch-surface-${colour}` would render unstyled.
 * The code panel prints these same strings, so what you read is exactly
 * what is painting the pitch.
 */

interface Theme {
  id: string;
  name: string;
  blurb: string;
  pitch: string;
  arrows: string;
  shots: string;
  /** Background classes for the three picker dots: surface, lines, accent. */
  swatch: [string, string, string];
}

const THEMES: Theme[] = [
  {
    id: "broadcast",
    name: "Broadcast",
    blurb: "Deep green, soft markings, one warm accent.",
    pitch:
      "pitch-surface-emerald-950 pitch-stripe-emerald-900 pitch-lines-emerald-200 pitch-line-width-1",
    arrows: "stroke-emerald-400 fill-emerald-400",
    shots: "fill-amber-300 stroke-emerald-950 hover:fill-white transition-colors",
    swatch: ["bg-emerald-950", "bg-emerald-200", "bg-amber-300"],
  },
  {
    id: "blueprint",
    name: "Blueprint",
    blurb: "Technical-drawing blues for analyst reports.",
    pitch: "pitch-surface-blue-950 pitch-stripe-blue-900 pitch-lines-sky-300 pitch-line-width-1",
    arrows: "stroke-sky-300 fill-sky-300",
    shots: "fill-white stroke-blue-950 hover:fill-sky-200 transition-colors",
    swatch: ["bg-blue-950", "bg-sky-300", "bg-white"],
  },
  {
    id: "chalkboard",
    name: "Chalkboard",
    blurb: "Heavy chalk lines on a tactics board.",
    pitch: "pitch-surface-zinc-900 pitch-stripe-zinc-800 pitch-lines-zinc-100 pitch-line-width-2",
    arrows: "stroke-yellow-200 fill-yellow-200",
    shots: "fill-rose-400 stroke-zinc-900 hover:fill-rose-200 transition-colors",
    swatch: ["bg-zinc-900", "bg-zinc-100", "bg-rose-400"],
  },
  {
    id: "neon",
    name: "Neon",
    blurb: "High-contrast, for social cards and thumbnails.",
    pitch:
      "pitch-surface-black pitch-stripe-neutral-950 pitch-lines-fuchsia-500 pitch-line-width-2",
    arrows: "stroke-cyan-300 fill-cyan-300",
    shots: "fill-lime-300 stroke-black hover:fill-white transition-colors",
    swatch: ["bg-black", "bg-fuchsia-500", "bg-lime-300"],
  },
  {
    id: "adaptive",
    name: "Adaptive",
    blurb: "Light on paper, dark at night — toggle the site theme.",
    pitch:
      "pitch-surface-stone-50 pitch-stripe-stone-100 pitch-lines-stone-400 pitch-line-width-1 dark:pitch-surface-stone-900 dark:pitch-stripe-stone-800 dark:pitch-lines-stone-500",
    arrows: "stroke-stone-700 fill-stone-700 dark:stroke-stone-300 dark:fill-stone-300",
    shots:
      "fill-red-600 stroke-stone-50 hover:fill-red-400 dark:stroke-stone-900 transition-colors",
    swatch: ["bg-stone-50", "bg-stone-400", "bg-red-600"],
  },
];

// StatsBomb coordinates (120 x 80): a switch of play, a run down the right
// channel, a cut-back — and the shots it led to.
const passes = [
  { x: 38, y: 18, x2: 62, y2: 60 },
  { x: 62, y: 60, x2: 88, y2: 70 },
  { x: 88, y: 70, x2: 110, y2: 58 },
  { x: 110, y: 58, x2: 104, y2: 42 },
];

const shots = [
  { x: 104, y: 42 },
  { x: 96, y: 34 },
  { x: 109, y: 37 },
  { x: 99, y: 48 },
];

const UTILITY_RECIPE = `/* globals.css — install once */
@import "tailwindcss";

@utility pitch-surface-* {
  --pitch-surface: --value(--color-*);
}
@utility pitch-stripe-* {
  --pitch-stripe: --value(--color-*);
}
@utility pitch-lines-* {
  --pitch-lines: --value(--color-*);
}
@utility pitch-line-width-* {
  --pitch-line-width: --value(number, [number]);
}`;

/** Wraps a long class list one class per line so the panel never scrolls sideways. */
function classAttr(classes: string, indent: string): string {
  const parts = classes.split(" ");
  if (parts.length <= 1) return `className="${classes}"`;
  return `className="\n${parts.map((c) => `${indent}  ${c}`).join("\n")}\n${indent}"`;
}

function componentSource(theme: Theme): string {
  return `<Pitch
  type="statsbomb"
  ${classAttr(theme.pitch, "  ")}
>
  <Arrows
    data={passes}
    x={(p) => p.x} y={(p) => p.y}
    x2={(p) => p.x2} y2={(p) => p.y2}
    ${classAttr(theme.arrows, "    ")}
  />
  <Scatter
    data={shots}
    x={(s) => s.x} y={(s) => s.y}
    r={6} strokeWidth={1.5}
    ${classAttr(theme.shots, "    ")}
  />
</Pitch>`;
}

type Tab = "component" | "css";

export function StylingShowcase() {
  const [themeId, setThemeId] = useState(THEMES[0]!.id);
  const [tab, setTab] = useState<Tab>("component");
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fd-primary">
            Styling
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground sm:text-3xl">
            Style it with the Tailwind classes you already have.
          </h2>
          <p className="text-sm leading-relaxed text-fd-muted-foreground">
            Every colour on a pitch is a <code className="text-fd-foreground">--pitch-*</code> CSS
            variable. Four lines of <code className="text-fd-foreground">@utility</code> turn them
            into classes that read straight from your Tailwind palette — and marks take plain{" "}
            <code className="text-fd-foreground">fill-*</code>/
            <code className="text-fd-foreground">stroke-*</code> utilities, with{" "}
            <code className="text-fd-foreground">hover:</code> and{" "}
            <code className="text-fd-foreground">dark:</code> variants for free. Pick a theme: the
            chart and its source change together.
          </p>
        </div>

        <div role="radiogroup" aria-label="Pitch theme" className="flex flex-col gap-2">
          {THEMES.map((t) => {
            const selected = t.id === theme.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setThemeId(t.id)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? "border-fd-primary/60 bg-fd-primary/10"
                    : "border-fd-border bg-fd-background hover:border-fd-primary/40 hover:bg-fd-accent/50"
                }`}
              >
                <span aria-hidden className="flex shrink-0 -space-x-1.5">
                  {t.swatch.map((bg) => (
                    <span
                      key={bg}
                      className={`size-4 rounded-full border border-fd-border ring-2 ring-fd-background ${bg}`}
                    />
                  ))}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-fd-foreground">{t.name}</span>
                  <span className="truncate text-xs text-fd-muted-foreground">{t.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link
            href="/docs/configuration/tailwind"
            className="font-medium text-fd-primary underline-offset-4 hover:underline"
          >
            Tailwind setup →
          </Link>
          <Link
            href="/docs/guides/theming"
            className="font-medium text-fd-muted-foreground underline-offset-4 transition-colors hover:text-fd-foreground hover:underline"
          >
            All theme variables →
          </Link>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-fd-border bg-fd-card">
        <div className="bg-fd-background p-4 sm:p-6">
          <Pitch
            type="statsbomb"
            appearance={{ stripes: true, goalType: "box" }}
            className={theme.pitch}
          >
            <Arrows
              data={passes}
              x={(p) => p.x}
              y={(p) => p.y}
              x2={(p) => p.x2}
              y2={(p) => p.y2}
              className={theme.arrows}
            />
            <Scatter
              data={shots}
              x={(s) => s.x}
              y={(s) => s.y}
              r={6}
              strokeWidth={1.5}
              className={theme.shots}
            />
          </Pitch>
        </div>

        <div
          role="tablist"
          aria-label="Source"
          className="flex gap-1 border-t border-fd-border px-3 pt-2"
        >
          {(
            [
              ["component", "shot-map.tsx"],
              ["css", "globals.css"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-2.5 py-1.5 font-mono text-xs transition-colors ${
                tab === id
                  ? "border-fd-primary text-fd-foreground"
                  : "border-transparent text-fd-muted-foreground hover:text-fd-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <CodeBlock
          lang={tab === "component" ? "tsx" : "css"}
          code={tab === "component" ? componentSource(theme) : UTILITY_RECIPE}
        />
      </div>
    </div>
  );
}
