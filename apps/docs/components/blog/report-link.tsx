import Link from "next/link";

/**
 * Sends the reader to a post's finished report, which lives on its own route
 * (`/blog/<slug>/report`) so they can look at it full width and come back.
 * A card rather than an inline link: it's the thing the post builds toward,
 * so it should be findable from the top of the page without hunting.
 */
export function ReportLink({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={`/blog/${slug}/report`}
      className="not-prose group my-6 flex items-center justify-between gap-4 rounded-xl border border-fd-border bg-fd-card px-5 py-4 transition-colors hover:border-fd-primary"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-base font-medium text-fd-foreground">{title}</span>
        <span className="text-sm text-fd-muted-foreground">{description}</span>
      </span>
      <span
        aria-hidden
        className="shrink-0 text-xl text-fd-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-fd-primary"
      >
        →
      </span>
    </Link>
  );
}
