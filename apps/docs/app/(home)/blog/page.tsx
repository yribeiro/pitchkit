import type { Metadata } from "next";
import Link from "next/link";
import { blogPostsByDate, formatPostDate } from "@/lib/source";
import { SITE_URL, X_HANDLE } from "@/lib/site";

const DESCRIPTION =
  "Walkthroughs from the PitchKit team: building football analysis for the web with PitchKit, " +
  "React and coding agents, from first prompt to finished report.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    siteName: "PitchKit",
    url: `${SITE_URL}/blog`,
    title: "Blog | PitchKit",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: X_HANDLE,
    title: "Blog | PitchKit",
    description: DESCRIPTION,
  },
};

export default function BlogIndex() {
  const posts = blogPostsByDate();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-3 pb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-fd-foreground">Blog</h1>
        <p className="max-w-2xl text-sm text-fd-muted-foreground">
          Walkthroughs for building football analysis on the web, from the first prompt to something
          you can send.
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-fd-border border-y border-fd-border">
        {posts.map((post) => (
          <li key={post.url}>
            <Link href={post.url} className="group flex flex-col gap-2 py-6">
              <span className="text-xs text-fd-muted-foreground">
                <time dateTime={post.data.date}>{formatPostDate(post.data.date)}</time>
                {post.data.series ? (
                  <>
                    {" · "}
                    {post.data.series}
                    {post.data.part ? `, part ${post.data.part}` : null}
                  </>
                ) : null}
              </span>
              <span className="text-lg font-medium text-fd-foreground group-hover:text-fd-primary">
                {post.data.title}
              </span>
              {post.data.description ? (
                <span className="text-sm text-fd-muted-foreground">{post.data.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
