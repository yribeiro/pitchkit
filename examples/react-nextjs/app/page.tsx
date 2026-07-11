import { HeatmapPanel } from "./HeatmapPanel";
import { LineupPanel } from "./LineupPanel";

/**
 * This page itself stays a plain Server Component (no "use client",
 * no interactivity) — it just composes two Client Component panels. See
 * LineupPanel.tsx for why the <Pitch> tree has to originate client-side
 * even though it's still fully present in the server-rendered HTML.
 */
export default function Home() {
  return (
    <main>
      <h1>@pitchkit/react — Next.js review app</h1>
      <p className="subtitle">App Router, React Server Components</p>

      <p className="callout">
        View page source (not devtools) on either panel below to confirm the pitch SVG is real
        server-rendered HTML in the initial response, not painted in after hydration. Both panels
        are Client Components — @pitchkit/react&apos;s layer API takes accessor <em>functions</em>{" "}
        as props (<code>x=&#123;(p) =&gt; p.x&#125;</code>), and functions can&apos;t cross the
        Server-&gt;Client boundary as props, so the &lt;Pitch&gt; tree has to originate inside a
        Client Component rather than being passed in from this page. Next still server-renders it to
        HTML first; &quot;use client&quot; only governs hydration and prop boundaries, not whether
        SSR happens.
      </p>

      <div className="grid">
        <LineupPanel />
        <HeatmapPanel />
      </div>
    </main>
  );
}
