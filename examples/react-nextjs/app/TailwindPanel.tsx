"use client";

import { Arrows, Comet, Pitch, Scatter } from "@pitchkit/react";
import type { PitchAppearance } from "@pitchkit/core";

interface Shot {
  x: number;
  y: number;
}

// StatsBomb coordinates (120 x 80).
const shots: Shot[] = [
  { x: 95, y: 35 },
  { x: 101, y: 42 },
  { x: 108, y: 38 },
];

const run = { from: { x: 30, y: 20 }, to: { x: 70, y: 55 } };
const pass = { from: { x: 40, y: 60 }, to: { x: 85, y: 30 } };

interface TailwindPanelProps {
  appearance: PitchAppearance;
}

const CLASSNAME_CODE = `<Comet
  data={[run]}
  x={(d) => d.from.x}
  y={(d) => d.from.y}
  x2={(d) => d.to.x}
  y2={(d) => d.to.y}
  className="fill-fuchsia-400"
/>
<Scatter
  data={shots}
  x={(d) => d.x}
  y={(d) => d.y}
  r={6}
  className="fill-emerald-400 stroke-white transition-colors hover:fill-emerald-200"
  strokeWidth={1.5}
/>`;

const ATTRIBUTE_CODE = `{/* no className prop on either mark below — the wrapper's
   Tailwind classes reach inside the SVG via data-pitchkit-mark.
   "!" is required: these marks never opted out of their inline
   default color, so an ordinary class can't out-rank it. */}
<div
  className="
    [&_[data-pitchkit-mark=arrow-head]]:fill-amber-400!
    [&_[data-pitchkit-mark=arrow-shaft]]:stroke-amber-400!
    [&_[data-pitchkit-mark=scatter]]:fill-cyan-400!
  "
>
  <Arrows
    data={[pass]}
    x={(d) => d.from.x}
    y={(d) => d.from.y}
    x2={(d) => d.to.x}
    y2={(d) => d.to.y}
  />
  <Scatter data={shots} x={(d) => d.x} y={(d) => d.y} r={6} />
</div>`;

const RECIPE_CODE = `<Pitch
  type="statsbomb"
  className="pitch-surface-emerald-950 pitch-stripe-emerald-800 pitch-lines-emerald-200"
/>`;

const LINE_WIDTH_CODE = `<Pitch type="statsbomb" className="pitch-line-width-4" />

{/* zero-setup equivalent, no @utility needed: */}
<Pitch type="statsbomb" className="[--pitch-line-width:4]" />`;

/** Collapsed by default; shows the exact JSX used to render the demo above it. */
function CodeAccordion({ code }: { code: string }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer select-none text-neutral-400 hover:text-neutral-200">
        View code
      </summary>
      <pre className="mt-2 overflow-x-auto rounded border border-neutral-800 bg-neutral-900 p-3 text-neutral-300">
        <code>{code}</code>
      </pre>
    </details>
  );
}

/**
 * Issue #7 (design how Tailwind integrates with @pitchkit/react): shows the
 * two mechanisms stacked, since they solve different problems and both need
 * to work.
 *
 * `className` prop (this issue's fix): color marks you own the JSX for via
 * Tailwind utilities instead of the `fill`/`stroke` props. Utilities have to
 * fully replace those accessor props here, not add to them — the library's
 * own computed `style={{ fill: ... }}` is inline and always wins over a
 * class, so passing both `fill="..."` and a `fill-*` utility would silently
 * drop the class.
 *
 * `data-pitchkit-mark`/`data-pitchkit-layer` arbitrary-variant selectors,
 * already present on every mark today with zero code changes. This is the
 * mechanism for styling marks whose JSX you *don't* own (e.g. a
 * shadcn-registry recipe wrapping `<Pitch>`) — note there's no `className`
 * prop passed to any layer component in that demo. Since those marks never
 * got a `className` (there's no local signal to back off the themed
 * default), their `fill`/`stroke` are still set as an inline style same as
 * always — an ordinary class-based rule can never out-rank an inline style,
 * so the utilities there need Tailwind's `!` important modifier to actually
 * win. That's a real constraint of this mechanism, not a demo
 * simplification.
 *
 * Third demo: the pitch *background* (outline/stripes/lines) isn't a mark —
 * it's `PitchGeometryShapes`, deliberately restyled only via the
 * `--pitch-surface`/`--pitch-stripe`/`--pitch-lines` CSS variables (see
 * `packages/core/src/theme/part-style.ts`), never via `className` on the
 * shapes directly. `globals.css` here defines `pitch-surface-*`/
 * `pitch-stripe-*`/`pitch-lines-*` as custom Tailwind utilities (the
 * `@utility ... --value(--color-*)` pattern) — a "shadcn add"-style recipe
 * that turns those variables into first-class, autocompletable utility
 * classes reading any color already in the project's Tailwind theme.
 *
 * Fourth demo: `--pitch-line-width` (default 1.5, see `part-style.ts`)
 * doesn't get the same win as color — Tailwind's own `stroke-1`/`stroke-2`
 * are bare numbers, not a `--stroke-width-*` namespace to borrow a palette
 * from — so `pitch-line-width-*` validates its own bare/arbitrary number via
 * `--value(number, [number])` rather than looking one up in the theme.
 * Shown next to the zero-setup arbitrary-property equivalent, since here the
 * two approaches are close enough in ergonomics that either is reasonable.
 */
export function TailwindPanel({ appearance }: TailwindPanelProps) {
  return (
    <section className="mt-8">
      <h2>Tailwind styling (issue #7)</h2>
      <p>
        Two ways to reach a mark with Tailwind utilities: <code>className</code> on marks you render
        yourself, or a <code>data-pitchkit-*</code> attribute selector on marks you don&apos;t.
      </p>
      <div className="flex flex-col gap-8">
        <div className="mx-auto w-4/5">
          <p className="mb-2 text-xs text-neutral-400">
            <code className="rounded bg-neutral-800 px-1 py-0.5">className</code> prop, color owned
            by Tailwind
          </p>
          <Pitch type="statsbomb" appearance={appearance}>
            <Comet
              data={[run]}
              x={(d) => d.from.x}
              y={(d) => d.from.y}
              x2={(d) => d.to.x}
              y2={(d) => d.to.y}
              className="fill-fuchsia-400"
            />
            <Scatter
              data={shots}
              x={(d) => d.x}
              y={(d) => d.y}
              r={6}
              className="fill-emerald-200 stroke-white transition-colors hover:fill-emerald-800"
              strokeWidth={1.5}
            />
          </Pitch>
          <CodeAccordion code={CLASSNAME_CODE} />
        </div>
        <div className="mx-auto w-4/5">
          <p className="mb-2 text-xs text-neutral-400">
            <code className="rounded bg-neutral-800 px-1 py-0.5">
              [&amp;_[data-pitchkit-mark=...]]:
            </code>{" "}
            on the wrapper, no <code className="rounded bg-neutral-800 px-1 py-0.5">className</code>{" "}
            prop below
          </p>
          <div className="[&_[data-pitchkit-mark=arrow-head]]:fill-amber-400! [&_[data-pitchkit-mark=arrow-shaft]]:stroke-amber-400! [&_[data-pitchkit-mark=scatter]]:fill-cyan-400!">
            <Pitch type="statsbomb" appearance={appearance}>
              <Arrows
                data={[pass]}
                x={(d) => d.from.x}
                y={(d) => d.from.y}
                x2={(d) => d.to.x}
                y2={(d) => d.to.y}
              />
              <Scatter data={shots} x={(d) => d.x} y={(d) => d.y} r={6} />
            </Pitch>
          </div>
          <CodeAccordion code={ATTRIBUTE_CODE} />
        </div>
        <div className="mx-auto w-4/5">
          <p className="mb-2 text-xs text-neutral-400">
            <code className="rounded bg-neutral-800 px-1 py-0.5">pitch-surface-*</code> /{" "}
            <code className="rounded bg-neutral-800 px-1 py-0.5">pitch-stripe-*</code> /{" "}
            <code className="rounded bg-neutral-800 px-1 py-0.5">pitch-lines-*</code> — custom
            utilities defined in{" "}
            <code className="rounded bg-neutral-800 px-1 py-0.5">globals.css</code>, theming the
            pitch background itself (not a mark)
          </p>
          <Pitch
            type="statsbomb"
            appearance={appearance}
            className="pitch-surface-emerald-950 pitch-stripe-emerald-800 pitch-lines-amber-600"
          />
          <CodeAccordion code={RECIPE_CODE} />
        </div>
        <div className="mx-auto w-4/5">
          <p className="mb-2 text-xs text-neutral-400">
            <code className="rounded bg-neutral-800 px-1 py-0.5">pitch-line-width-*</code> — no
            preset scale to borrow (unlike color), just a validated bare number
          </p>
          <Pitch
            type="statsbomb"
            appearance={appearance}
            className="pitch-line-width-8 pitch-lines-amber-700 pitch-surface-black pitch-stripe-gray-600"
          />
          <CodeAccordion code={LINE_WIDTH_CODE} />
        </div>
      </div>
    </section>
  );
}
