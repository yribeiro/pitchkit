import { notFound } from "next/navigation";
import { networkOverlay, ogCard, shotsOverlay, trackingOverlay } from "@/lib/og-card";
import { source } from "@/lib/source";

/**
 * One social card per docs page, so a shared link to (say) the SkillCorner
 * tracking reference unfurls as that page — its title, its description, and a
 * pitch preview in the visual language of its section — rather than the
 * site-wide card.
 *
 * This is a plain image route referenced from each page's `generateMetadata`
 * (`openGraph.images`), not an `opengraph-image.tsx` file convention: the docs
 * page route is an *optional* catch-all (`[[...slug]]`), and Next refuses to
 * put any segment after an optional catch-all, which is exactly where the
 * convention's metadata-id segment would land.
 *
 * The docs index borrows the slug `index` because a non-optional catch-all
 * needs at least one segment.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slugs: string[] }> }) {
  const { slugs } = await params;
  const pages = source.getPages();
  const page = source.getPage(slugs.length === 1 && slugs[0] === "index" ? [] : slugs);
  if (!page) notFound();

  const section = page.slugs[0];
  // A folder's index page (slugs `["data"]`) *is* that section, so its own slug
  // belongs in the eyebrow — otherwise every section's Overview card would say
  // just "DOCS". Leaf pages drop their last slug, which the title repeats.
  const isIndexPage = pages.some(
    (other) =>
      other.slugs.length > page.slugs.length &&
      page.slugs.every((part, i) => other.slugs[i] === part),
  );
  const crumbs = isIndexPage ? page.slugs : page.slugs.slice(0, -1);
  const eyebrow = ["DOCS", ...crumbs.map((part) => part.toUpperCase())].join(" · ");

  return ogCard({
    brand: "badge",
    eyebrow,
    title: page.data.title,
    descriptionSize: 28,
    description: page.data.description ?? "PitchKit documentation.",
    overlay: section ? OVERLAYS[section] : undefined,
  });
}

/** The data-viz overlay each top-level section's cards carry. */
const OVERLAYS: Record<string, string> = {
  data: trackingOverlay,
  agents: networkOverlay,
  components: shotsOverlay,
  overlays: shotsOverlay,
  guides: shotsOverlay,
};

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slugs: page.slugs.length ? page.slugs : ["index"],
  }));
}
