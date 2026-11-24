import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blog } from "@/lib/source";

/**
 * A post's finished report, shown inside the site.
 *
 * The report is a standalone HTML file from `public/blog/<slug>/`, exactly as
 * the post's prompts produced it, and is served in a frame so its own styles
 * and keyboard handling stay out of the site. The bar above it is the way
 * back: the point of this page is to look at the report and return to the
 * post, not to host it.
 */
export default async function ReportPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = blog.getPage([slug]);
  if (!post?.data.report) notFound();

  const src = `/blog/${slug}/${post.data.report}`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-fd-border px-4 py-3 text-sm">
        <Link href={post.url} className="text-fd-muted-foreground hover:text-fd-foreground">
          ← Back to the post
        </Link>
        <a
          href={src}
          target="_blank"
          rel="noopener"
          className="text-fd-muted-foreground hover:text-fd-foreground"
        >
          Open on its own
        </a>
      </div>
      <iframe
        src={src}
        title={`${post.data.title}: the finished report`}
        className="min-h-[75dvh] w-full flex-1 border-0 bg-[#0a0a0a]"
      />
    </div>
  );
}

export function generateStaticParams() {
  return blog
    .getPages()
    .filter((post) => post.data.report)
    .map((post) => ({ slug: post.slugs[0] }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = blog.getPage([slug]);
  if (!post?.data.report) notFound();

  return {
    title: `${post.data.title}: the finished report`,
    description: "The finished report from the post, shown at full width.",
    // The post is the page worth finding; this one is a viewer for it.
    robots: { index: false },
  };
}
