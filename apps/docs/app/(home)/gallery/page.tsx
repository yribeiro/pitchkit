import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery-grid";
import { SITE_URL, X_HANDLE } from "@/lib/site";

const DESCRIPTION =
  "Finished football visualisations built with PitchKit, the React and TypeScript charting " +
  "library for football — shot maps, pass networks, heatmaps, hexbins, KDE surfaces, Voronoi, xG race " +
  "and match momentum charts — each with its full source.";

export const metadata: Metadata = {
  title: "Gallery",
  description: DESCRIPTION,
  alternates: { canonical: "/gallery" },
  openGraph: {
    type: "website",
    siteName: "PitchKit",
    url: `${SITE_URL}/gallery`,
    title: "Gallery | PitchKit",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: X_HANDLE,
    title: "Gallery | PitchKit",
    description: DESCRIPTION,
  },
};

export default function GalleryPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-3 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-fd-foreground">Gallery</h1>
        <p className="max-w-2xl text-sm text-fd-muted-foreground">
          Finished visualisations, each built from a handful of composable pieces. Every card ships
          its full source — copy it, or open it as a standalone project.
        </p>
      </div>
      <GalleryGrid />
    </main>
  );
}
