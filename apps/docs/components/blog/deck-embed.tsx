/**
 * A finished HTML deck from `public/`, playable in place on a blog post.
 *
 * The deck is the file a post's prompts produced, served as-is, so readers see
 * the real output rather than a re-creation of it. It sits in an iframe so its
 * own styles and keyboard handling can't leak into the site. Wider than the
 * prose column from `lg` up, because charts at 640px wide are hard to read;
 * taller than 16:9 on phones, where the deck stacks its slides' content.
 */
export function DeckEmbed({ src, title }: { src: string; title: string }) {
  return (
    <figure className="not-prose my-8 lg:-mx-24">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-fd-border bg-[#0a0a0a] sm:aspect-video">
        <iframe src={src} title={title} loading="lazy" className="h-full w-full border-0" />
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-fd-muted-foreground">
        <span>Swipe, or use the arrows or your arrow keys, to move through the slides.</span>
        <a
          href={src}
          target="_blank"
          rel="noopener"
          className="font-medium text-fd-foreground underline decoration-fd-primary underline-offset-4"
        >
          Open full screen
        </a>
      </figcaption>
    </figure>
  );
}
