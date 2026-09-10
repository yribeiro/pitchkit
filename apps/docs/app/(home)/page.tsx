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
    title: "SSR-ready",
    body: "Marks render to real SVG on the server — verified against Next.js App Router. No hydration flicker, no client-only placeholder boxes.",
    href: "/docs/guides/nextjs-ssr",
  },
  {
    title: "Hybrid SVG + Canvas",
    body: "Interactive marks stay crisp, inspectable SVG; dense heatmaps paint to canvas. Each surface does what it's actually good at.",
    href: "/docs/overlays/heatmap",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-14 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:pt-24">
        <div className="flex flex-col items-start gap-5">
          <span className="rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-medium text-fd-muted-foreground">
            React-native · TypeScript-first · MIT
          </span>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-fd-foreground sm:text-5xl">
            The football pitch layer for the web.
          </h1>
          <p className="max-w-xl text-balance text-fd-muted-foreground">
            PitchKit is mplsoccer for the browser — declarative pitch visualisations with
            typed accessors, responsive SVG marks, canvas heatmaps, and theming that works
            like the rest of your design system.
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
              <h2 className="text-sm font-semibold text-fd-foreground">
                {f.title}
                <span
                  aria-hidden
                  className="ml-1 inline-block text-fd-muted-foreground/0 transition-all group-hover:translate-x-0.5 group-hover:text-fd-primary"
                >
                  →
                </span>
              </h2>
              <p className="text-sm leading-relaxed text-fd-muted-foreground">{f.body}</p>
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
            The concepts map one-to-one — pitches, marks, accessors. The cheatsheet translates
            each mplsoccer call to its PitchKit equivalent.
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
