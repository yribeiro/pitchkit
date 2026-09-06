/**
 * The /gallery page's catalogue: which registry examples appear, under
 * which category tab, with display copy. Scoped deliberately to what's
 * buildable with today's mark set (issue #28) — new-mark entries (hexbin,
 * KDE, radar…) get added here incrementally as each Milestone 2 mark lands.
 */

export const GALLERY_CATEGORIES = ["All", "Shooting", "Passing", "Structure", "Density"] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export interface GalleryEntry {
  /** Registry name (see components/examples/registry.ts). */
  name: string;
  title: string;
  description: string;
  category: Exclude<GalleryCategory, "All">;
  /** Docs page for the entry's headline mark. */
  docsHref: string;
}

export const GALLERY_ENTRIES: GalleryEntry[] = [
  {
    name: "shot-map-gallery",
    title: "Shot map",
    description:
      "Attacking half, vertical framing — markers sized by xG, colored by outcome, goal angle on the best chance.",
    category: "Shooting",
    docsHref: "/docs/overlays/scatter",
  },
  {
    name: "buildup-gallery",
    title: "Annotated build-up",
    description:
      "One goal-scoring move told on a single pitch: comet trails for progression, labelled touches, the shot's angle.",
    category: "Shooting",
    docsHref: "/docs/overlays/comet",
  },
  {
    name: "pass-network-gallery",
    title: "Pass network",
    description:
      "Average positions with node size by touches and edge width by pass volume — the classic recipe from three primitives.",
    category: "Passing",
    docsHref: "/docs/overlays/arrows",
  },
  {
    name: "pass-flow-gallery",
    title: "Pass flow",
    description:
      "Passes binned by start zone, one arrow per zone showing average direction, sized and colored by volume.",
    category: "Passing",
    docsHref: "/docs/overlays/flow",
  },
  {
    name: "defensive-shape-gallery",
    title: "Team shape",
    description:
      "Convex hulls over both teams' outfield positions — compactness and the space between the lines at a glance.",
    category: "Structure",
    docsHref: "/docs/overlays/convex-hull",
  },
  {
    name: "zonal-control-gallery",
    title: "Zonal control",
    description:
      "A Voronoi tessellation over all 22 players, cells colored by team — who controls which patch of grass.",
    category: "Structure",
    docsHref: "/docs/overlays/voronoi",
  },
  {
    name: "pressure-heatmap-gallery",
    title: "Pressure heatmap",
    description:
      "Ball-recovery pressure events binned over a fine grid on the canvas path — dense raster data without SVG's DOM cost.",
    category: "Density",
    docsHref: "/docs/overlays/heatmap",
  },
];
