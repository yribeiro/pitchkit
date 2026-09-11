import Link from "next/link";
import { HeroPitch } from "@/components/hero-pitch";
import { InstallCommand } from "@/components/install-command";
import { PitchKitMark } from "@/components/pitchkit-logo";

/**
 * The shadcn-style showcase landing page (issue #28, PRD §9): interactive
 * hero pitch, feature grid, and a gallery/docs funnel. Chrome uses the
 * fumadocs theme tokens (fd-*) + Tailwind only; the hero pitch itself is
 * themed through `--pitch-*` CSS variables like every other pitch on the
 * site — no second theming mechanism.
 */

const FEATURES: { title: string; body: string; href: string }[] = [
  {
    title: "Composable layers",
    body: "Scatter, arrows, comets, heatmaps, Voronoi — declared as JSX children of <Pitch>, stacked in render order like any other React tree.",
    href: "/docs/guides/layers",
  },
  {
    title: "Provider-agnostic coordinates",
    body: "StatsBomb, Opta, and UEFA coordinate systems out of the box. Feed data in its native units; one transform pipeline keeps everything aligned.",
    href: "/docs/guides/coordinates",
  },
  {
    title: "Agent compatible",
    body: "No model has PitchKit in its training data — so the package ships its own Agent Skill, symlinked into your agent's skills and updated the moment npm update is.",
    href: "/docs/configuration/agent-skill",
  },
  {
    title: "Responsive by default",
    body: "Every pitch fills its container via ResizeObserver, with a correct-aspect-ratio first paint. Explicit width/height is the opt-out, not the default.",
    href: "/docs/guides/responsive",
  },
  {
    title: "CSS-variable theming",
    body: "Colours are --pitch-* variables, shadcn-style — set them once in your stylesheet, get dark mode for free, override per-chart with a wrapper div.",
    href: "/docs/guides/theming",
  },
  {
    title: "Real data in one call",
    body: "fetchMatchEvents(id) returns typed events straight from StatsBomb open data — shots, passes, carries and 360 tracking, ready to plot. No adapter, no field mapping.",
    href: "/docs/data",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-14 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:pt-24">
        <div className="flex flex-col items-start gap-5">
          <span className="rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-medium text-fd-muted-foreground">
            React-first for the Web · TypeScript · MIT
          </span>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-fd-foreground sm:text-5xl">
            The football pitch layer for the web.
          </h1>
          <p className="max-w-xl text-balance text-fd-muted-foreground">
            PitchKit is mplsoccer for the browser — declarative pitch visualisations with typed
            accessors, responsive SVG marks, canvas heatmaps, and theming that works like the rest
            of your design system.
          </p>
          <InstallCommand />
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/docs"
              className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/gallery"
              className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
            >
              Browse the gallery
            </Link>
          </div>
        </div>
        <HeroPitch />
      </section>

      {/* Feature grid */}
      <section className="border-t border-fd-border bg-fd-card/40">
        <div className="mx-auto grid w-full max-w-6xl gap-px overflow-hidden px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group flex flex-col gap-2 rounded-lg p-5 transition-colors hover:bg-fd-accent/60"
            >
              <h2 className="text-sm font-semibold text-fd-foreground">{f.title}</h2>
              <p className="text-sm leading-relaxed text-fd-muted-foreground">{f.body}</p>
              {/* Always visible rather than hover-only: on a grid of cards that
                  are entirely link, a permanent affordance is what signals
                  they're clickable at all — hover can't advertise itself.
                  Drawn as SVG rather than a "→" glyph so the stroke weight is
                  ours to set instead of the body font's. */}
              <span
                aria-hidden
                className="mt-auto flex justify-end pt-3 text-fd-primary/70 transition-all group-hover:translate-x-0.5 group-hover:text-fd-primary"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-fd-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground">
            Coming from mplsoccer?
          </h2>
          <p className="max-w-lg text-sm text-fd-muted-foreground">
            The concepts map one-to-one — pitches, marks, accessors. The cheatsheet translates each
            mplsoccer call to its PitchKit equivalent.
          </p>
          <Link
            href="/docs/migration"
            className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            Read the migration guide
          </Link>
        </div>
      </section>

      <footer className="border-t border-fd-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-fd-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <PitchKitMark size={15} className="text-fd-primary" />
            PitchKit — MIT licensed, open source.
          </span>
          <div className="flex gap-4">
            <Link href="/docs" className="transition-colors hover:text-fd-foreground">
              Docs
            </Link>
            <Link href="/gallery" className="transition-colors hover:text-fd-foreground">
              Gallery
            </Link>
            <a
              href="https://github.com/yribeiro/pitchkit"
              className="transition-colors hover:text-fd-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
