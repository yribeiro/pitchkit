import Link from "next/link";

/**
 * Minimal, visually clean landing stub — deliberately not the full
 * shadcn-style showcase (hero animation, gallery, marketing copy) that PRD
 * §9 describes; that's a follow-up issue once this skeleton's live-example
 * pipeline is validated.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-medium text-fd-muted-foreground">
        Milestone 1 — docs skeleton
      </span>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-fd-foreground sm:text-5xl">
        Football pitch visualisation, built for the web.
      </h1>
      <p className="max-w-xl text-balance text-fd-muted-foreground">
        PitchKit is a TypeScript-native pitch visualisation library — mplsoccer for the browser —
        with responsive SVG marks, canvas heatmaps, and first-class React bindings.
      </p>
      <Link
        href="/docs"
        className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
      >
        Read the docs
      </Link>
    </main>
  );
}
