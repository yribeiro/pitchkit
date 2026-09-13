import { ogCard } from "@/lib/og-card";

/**
 * The social card every share of pitchkitjs.com renders.
 *
 * 1200x630 is 1.9:1, which is close enough to a real pitch's 105:68 that a
 * full pitch actually fits here — the one surface in the whole identity where
 * drawing the literal thing is the right answer rather than the naive one. So
 * the mark carries the brand and a full UEFA pitch, at real marking
 * proportions, sits behind it as ground.
 *
 * An explicit image route referenced from the root metadata's
 * `openGraph.images`, the same pattern as every other card (`/gallery/og`,
 * `/docs/og/…`). The docs pages cannot use the `opengraph-image.tsx` file
 * convention at all — their route is an *optional* catch-all (`[[...slug]]`),
 * and Next refuses to put the convention's metadata-id segment after one — so
 * one mechanism across all cards beats two.
 */
export function GET() {
  return ogCard({
    brand: "title",
    titleSize: 82,
    title: (
      <>
        <span style={{ color: "#e2ede8" }}>Pitch</span>
        <span style={{ color: "#34d399", marginLeft: -9 }}>Kit</span>
      </>
    ),
    descriptionSize: 34,
    description: "A React-first football pitch visualisation library for the web.",
  });
}
