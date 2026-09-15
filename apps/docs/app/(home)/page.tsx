import type { Metadata } from "next";
import Link from "next/link";
import { HeroPitch } from "@/components/hero-pitch";
import { InstallCommand } from "@/components/install-command";
import { PitchKitMark } from "@/components/pitchkit-logo";
import { SEARCH_DESCRIPTION, SITE_URL, SUBHEAD, TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The shadcn-style showcase landing page (issue #28, PRD §9): interactive
 * hero pitch, feature grid, and a gallery/docs funnel. Chrome uses the
 * fumadocs theme tokens (fd-*) + Tailwind only; the hero pitch itself is
 * themed through `--pitch-*` CSS variables like every other pitch on the
 * site — no second theming mechanism.
 */

/**
 * `icon` is the `d` of a single 24×24 stroked path, not a component: these
 * are decorative scanning anchors, and six inline paths cost nothing next
 * to pulling in an icon dependency for one section.
 */
const FEATURES: { title: string; body: string; href: string; icon: string }[] = [
  {
    title: "Composable layers",
    body: "Scatter, arrows, comets, heatmaps, Voronoi — declared as JSX children of <Pitch>, stacked in render order like any other React tree.",
    href: "/docs/guides/layers",
    icon: "M12 2 2 7l10 5 10-5-10-5ZM2 12l10 5 10-5M2 17l10 5 10-5",
  },
  {
    title: "Provider-agnostic coordinates",
    body: "StatsBomb, SkillCorner, Opta and UEFA coordinate systems out of the box — including SkillCorner's centre-origin metres. Feed data in its native units; one transform pipeline keeps everything aligned.",
    href: "/docs/guides/coordinates",
    icon: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18",
  },
  {
    title: "Agent compatible",
    body: "No model has PitchKit in its training data — so the package ships its own Agent Skill, symlinked into your agent's skills and updated the moment npm update is.",
    href: "/docs/agents",
    icon: "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8",
  },
  {
    title: "Responsive by default",
    body: "Every pitch fills its container via ResizeObserver, with a correct-aspect-ratio first paint. Explicit width/height is the opt-out, not the default.",
    href: "/docs/guides/responsive",
    icon: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  },
  {
    title: "CSS-variable theming",
    body: "Colours are --pitch-* variables, shadcn-style — set them once in your stylesheet, get dark mode for free, override per-chart with a wrapper div.",
    href: "/docs/guides/theming",
    icon: "M12 2.7 6.7 8a7.5 7.5 0 1 0 10.6 0L12 2.7Z",
  },
  {
    title: "Real data in one call",
    body: "fetchMatchEvents(id) returns typed events straight from StatsBomb open data — shots, passes, carries and 360 tracking, ready to plot. No adapter, no field mapping.",
    href: "/docs/data",
    icon: "M3 5c0-1.7 4-3 9-3s9 1.3 9 3-4 3-9 3-9-1.3-9-3ZM3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3",
  },
];

/**
 * The questions people actually type when they're looking for something like
 * this, answered in prose.
 *
 * Everything else on this page is written for someone who already knows what
 * PitchKit is — "mplsoccer for the web" only parses if you know mplsoccer.
 * This block is the other door: it says "React", "TypeScript", "charting
 * library", "football web application" in plain sentences, which is both what
 * a search engine matches on and what an AI answer engine can lift and cite.
 *
 * Rendered visibly AND as FAQPage JSON-LD below, from this same array. The two
 * must agree — structured data that doesn't match the visible page is
 * discounted, and hand-maintaining a second copy is how they stop agreeing.
 */
const FAQ: { q: string; a: string }[] = [
  {
    q: "Is there a React library for football visualisations?",
    a: "PitchKit is one. It renders football (soccer) pitches and the data plotted on them as ordinary React components — <Pitch> with layers like <Scatter>, <Arrows>, <Comet>, <Heatmap> and <Voronoi> declared as its children. There is no imperative drawing API and no canvas to manage: you compose marks in JSX the way you compose anything else in a React tree, and the pitch re-renders when your data changes.",
  },
  {
    q: "What is a good charting library for football data?",
    a: "PitchKit is a charting library built specifically for football data. Shot maps, pass networks, pass maps, heatmaps, hexbins, KDE surfaces, convex hulls, Voronoi control zones and goal-angle wedges all ship as layers, with pitch markings, aspect ratio and coordinate handling already correct — so you plot events in their own coordinates rather than mapping them onto a generic set of axes first. For non-spatial charts it composes happily alongside whichever general-purpose charting library you already use.",
  },
  {
    q: "Can I build football visualisations in TypeScript?",
    a: "PitchKit is written in TypeScript and ships its own types — no @types package and no any at the boundary. Accessors are generic over your row type, so <Scatter data={shots} x={(s) => s.x} /> infers the element type from the array you pass and your editor autocompletes the fields. The data loaders are typed to each provider's real schema, so a mistyped event field is a compile error rather than an empty pitch.",
  },
  {
    q: "Can I use PitchKit in a football web application?",
    a: "Yes — it is built for the browser. It works in any React application, including Next.js with server-side rendering, and pitches are responsive by default: each one fills its container via ResizeObserver with a correct-aspect-ratio first paint, so it behaves inside a dashboard, a match report or a scouting tool without fixed sizing. Theming is CSS variables, so it inherits your application's design tokens and dark mode instead of bringing its own.",
  },
  {
    q: "How does PitchKit compare to mplsoccer?",
    a: "mplsoccer is the reference football visualisation library for Python and matplotlib, and PitchKit covers the same ground for the web. The concepts map one-to-one — pitches, marks, accessors — so a shot map you know how to build in mplsoccer has a direct PitchKit equivalent. The difference is the target: mplsoccer renders figures for Python analysis and publication, PitchKit renders interactive DOM for shipping inside a web application. Pick whichever matches where the chart needs to end up. The migration guide translates each mplsoccer call to its PitchKit equivalent.",
  },
  {
    q: "Which football data providers does PitchKit support?",
    a: "StatsBomb, SkillCorner, Opta and UEFA coordinate systems are handled natively — feed data in its own units and one transform pipeline keeps everything aligned. @pitchkit/data-providers goes further and fetches it for you: fetchMatchEvents(id) returns typed StatsBomb open-data events ready to plot, including 360 freeze frames, and the SkillCorner module streams broadcast tracking, dynamic events and phases of play.",
  },
];

/**
 * Structured data, so an answer engine can state what this is without having
 * to infer it from marketing copy, and so a search result can carry the FAQ.
 *
 * SoftwareSourceCode rather than SoftwareApplication: this is a library a
 * developer installs, not an app anyone runs, and the wrong type invites
 * "free / requires iOS" style rendering in results.
 */
function StructuredData() {
  const graph = [
    {
      "@type": "SoftwareSourceCode",
      "@id": `${SITE_URL}/#software`,
      name: "PitchKit",
      alternateName: "@pitchkit/react",
      description: SEARCH_DESCRIPTION,
      url: SITE_URL,
      codeRepository: "https://github.com/yribeiro/pitchkit",
      programmingLanguage: ["TypeScript", "JavaScript"],
      runtimePlatform: ["React", "Next.js", "Node.js", "Browser"],
      license: "https://opensource.org/licenses/MIT",
      applicationCategory: "DeveloperApplication",
      keywords:
        "react library for football, football visualisation library, charting library for football, typescript football visualisations, football web application library, soccer analytics",
      author: {
        "@type": "Person",
        name: "Yohahn Ribeiro",
        url: "https://github.com/yribeiro",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Safe: every value in `graph` is a literal in this file, so there is no
      // untrusted input to escape.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <StructuredData />

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-14 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:pt-24">
        {/* `min-w-0` is load-bearing, not decoration: a grid item defaults to
            `min-width: auto`, so the install command's nowrap monospace string
            set the column's min-content width and blew the whole hero past the
            viewport on narrow screens. */}
        <div className="flex min-w-0 flex-col items-start gap-5">
          <span className="rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-medium text-fd-muted-foreground">
            React First · AI Native · TypeScript · MIT
          </span>
          {/* Both strings come from lib/site.ts, which the page metadata and
              the generated OG image also read — a shared link has to preview
              as the page it opens. */}
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-fd-foreground sm:text-5xl">
            {TAGLINE}
          </h1>
          <p className="max-w-xl text-fd-muted-foreground">{SUBHEAD}</p>
          <InstallCommand />
          {/* Below `sm` the CTAs split as 2-cols with the gallery spanning full
              width; from `sm` up they form a 3-column equal-width grid filling
              the available width. */}
          <div className="grid w-full max-w-xl grid-cols-2 gap-3 pt-1 sm:grid-cols-3">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-lg bg-fd-primary px-3 py-2.5 text-center text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/docs/agents"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-fd-primary/40 bg-fd-primary/5 px-3 py-2.5 text-center text-sm font-medium text-fd-foreground transition-colors hover:border-fd-primary/60 hover:bg-fd-primary/10"
            >
              <svg
                aria-hidden
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-fd-primary"
              >
                <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M18.4 5.6l-2.5 2.5M8.1 15.9l-2.5 2.5" />
              </svg>
              Build with AI
            </Link>
            <Link
              href="/gallery"
              className="col-span-2 inline-flex items-center justify-center rounded-lg border border-fd-border px-3 py-2.5 text-center text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent sm:col-span-1"
            >
              Browse the gallery
            </Link>
          </div>
        </div>
        <HeroPitch />
      </section>

      {/* Feature grid */}
      <section className="border-t border-fd-border bg-fd-card/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          {/* The section had no heading at all, so six equally-weighted cards
              were the top of its hierarchy and the page jumped from <h1> to
              six sibling <h2>s. An eyebrow + <h2> gives the block something
              to hang off and demotes the cards to <h3>, fixing the visual
              hierarchy and the document outline in the same move. */}
          <div className="flex max-w-2xl flex-col gap-3 pb-10 sm:pb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fd-primary">
              Why PitchKit
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground sm:text-3xl">
              Built for the way you already write React.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-background p-5 transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-card text-fd-primary transition-colors group-hover:border-fd-primary/40"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={f.icon} />
                    </svg>
                  </span>
                  {/* Always visible rather than hover-only: on a grid of cards
                      that are entirely link, a permanent affordance is what
                      signals they're clickable at all — hover can't advertise
                      itself. Sits on the icon's row instead of the card's
                      bottom edge, where uneven body lengths used to strand it
                      below a block of dead space. Drawn as SVG rather than a
                      "→" glyph so the stroke weight is ours to set instead of
                      the body font's. */}
                  <span
                    aria-hidden
                    className="mt-1 text-fd-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-fd-primary"
                  >
                    <svg
                      width="16"
                      height="16"
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
                </div>
                <h3 className="text-base font-semibold leading-snug text-fd-foreground">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-fd-muted-foreground">{f.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — see the FAQ constant for why this section exists. */}
      <section className="border-t border-fd-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <div className="flex max-w-2xl flex-col gap-3 pb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fd-primary">
              Questions
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground sm:text-3xl">
              What PitchKit is, in plain terms.
            </h2>
          </div>

          {/* Plain <details> rather than an accordion component: these answers
              have to be in the DOM and readable with no JavaScript for a
              crawler to use them, and native disclosure gives that for free
              along with keyboard behaviour and find-in-page expansion. */}
          {/* One full-width column, not a two-up grid: as a grid, opening a
              card grew its row and shunted its neighbour, and the eye had no
              single reading order through the questions. The answer paragraph
              carries its own max-w-3xl so a long answer still reads at a
              sensible measure inside the wide card. */}
          <div className="flex flex-col gap-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-fd-border bg-fd-card/40 p-5 transition-colors open:bg-fd-card/70 hover:border-fd-primary/40"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold leading-snug text-fd-foreground marker:content-none">
                  <h3 className="text-base font-semibold leading-snug">{item.q}</h3>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-fd-muted-foreground/60 transition-transform group-open:rotate-45"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="max-w-3xl pt-3 text-sm leading-relaxed text-fd-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
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
