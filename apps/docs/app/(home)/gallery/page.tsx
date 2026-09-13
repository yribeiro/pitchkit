import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery-grid";
import { OG_SIZE } from "@/lib/og-meta";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Finished football visualisations built with PitchKit — shot maps, pass networks, heatmaps, hexbins, KDE surfaces, Voronoi — each with its full source.",
  openGraph: {
    images: [
      {
        url: "/gallery/og",
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        alt: "PitchKit Gallery — finished football visualisations with full source",
      },
    ],
  },
};

export default function GalleryPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-3 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-fd-foreground">Gallery</h1>
        <p className="max-w-2xl text-sm text-fd-muted-foreground">
          Finished visualisations, each built from the same handful of composable layers. Every card
          ships its full source — copy it, or open it as a standalone project.
        </p>
      </div>
      <GalleryGrid />
    </main>
  );
}
