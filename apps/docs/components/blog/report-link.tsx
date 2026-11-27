import Link from "next/link";

/**
 * Sends the reader to a post's finished report, which lives on its own route
 * (`/blog/<slug>/report`) so they can look at it full width and come back.
 * A card rather than an inline link: it's the thing the post builds toward,
 * so it should be findable from the top of the page without hunting.
 *
 * `pdf` is a file name in `public/blog/<slug>/`. It's a plain anchor with
 * `download`, not a Next link: a client-side link swallows the click on a path
 * that isn't a route.
 */
export function ReportLink({
  slug,
  title,
  description,
  pdf,
}: {
  slug: string;
  title: string;
  description: string;
  pdf?: string;
}) {
  return (
    <div className="not-prose my-6 rounded-xl border border-fd-border bg-fd-card">
      <Link
        href={`/blog/${slug}/report`}
        className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:text-fd-primary"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-base font-medium text-fd-foreground group-hover:text-fd-primary">
            {title}
          </span>
          <span className="text-sm text-fd-muted-foreground">{description}</span>
        </span>
        <span
          aria-hidden
          className="shrink-0 text-xl text-fd-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-fd-primary"
        >
          →
        </span>
      </Link>
      {pdf ? (
        <a
          href={`/blog/${slug}/${pdf}`}
          download
          className="flex items-center justify-between gap-4 border-t border-fd-border px-5 py-3 text-sm text-fd-muted-foreground transition-colors hover:text-fd-primary"
        >
          <span>Download the PDF</span>
          <span aria-hidden>↓</span>
        </a>
      ) : null}
    </div>
  );
}
