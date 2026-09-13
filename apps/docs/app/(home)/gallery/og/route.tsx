import { ogCard, shotsOverlay } from "@/lib/og-card";

/**
 * The gallery's own share card: same brand object as the site card, led by the
 * page's title and copy, with a shot-map overlay standing in for the finished
 * visualisations the page collects.
 */
export function GET() {
  return ogCard({
    brand: "badge",
    title: "Gallery",
    descriptionSize: 28,
    description:
      "Finished visualisations, each built from the same handful of composable layers. Every card ships its full source — copy it, or open it as a standalone project.",
    overlay: shotsOverlay,
  });
}
