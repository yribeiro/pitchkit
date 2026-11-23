import defaultMdxComponents from "fumadocs-ui/mdx";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import type { Metadata } from "next";
import type { ComponentProps } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckEmbed } from "@/components/blog/deck-embed";
import { blog, formatPostDate } from "@/lib/source";
import { SITE_URL, X_HANDLE } from "@/lib/site";

/**
 * Posts link to finished example files in `public/` (a report, say). The default
 * MDX link is a client-side Next link, which swallows the click on a path that
 * isn't a route, so static `.html` files get a plain anchor in a new tab.
 */
function PostLink(props: ComponentProps<"a">) {
  if (props.href?.endsWith(".html")) {
    return <a {...props} target="_blank" rel="noopener" />;
  }
  const DefaultLink = defaultMdxComponents.a;
  return <DefaultLink {...props} />;
}

export default async function BlogPost(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = blog.getPage([slug]);
  if (!post) notFound();

  const MDXContent = post.data.body;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/blog" className="text-sm text-fd-muted-foreground hover:text-fd-foreground">
        ← Blog
      </Link>
      <header className="flex flex-col gap-4 border-b border-fd-border pt-8 pb-8">
        {post.data.series ? (
          <p className="text-xs font-medium tracking-wide text-fd-primary uppercase">
            {post.data.series}
            {post.data.part ? ` · Part ${post.data.part}` : null}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-fd-foreground sm:text-4xl">
          {post.data.title}
        </h1>
        {post.data.description ? (
          <p className="text-lg text-fd-muted-foreground">{post.data.description}</p>
        ) : null}
        <p className="text-sm text-fd-muted-foreground">
          {post.data.author} ·{" "}
          <time dateTime={post.data.date}>{formatPostDate(post.data.date)}</time>
        </p>
      </header>
      <article className="prose min-w-0 pt-8">
        <MDXContent
          components={{ ...defaultMdxComponents, a: PostLink, DeckEmbed, Tab, Tabs, Step, Steps }}
        />
      </article>
    </div>
  );
}

export function generateStaticParams() {
  return blog.getPages().map((post) => ({ slug: post.slugs[0] }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = blog.getPage([slug]);
  if (!post) notFound();

  const { title, description, author, date } = post.data;

  return {
    title,
    description,
    authors: [{ name: author }],
    alternates: { canonical: post.url },
    openGraph: {
      type: "article",
      siteName: "PitchKit",
      url: `${SITE_URL}${post.url}`,
      title: `${title} | PitchKit`,
      description,
      publishedTime: date,
      authors: [author],
    },
    twitter: {
      card: "summary_large_image",
      site: X_HANDLE,
      title: `${title} | PitchKit`,
      description,
    },
  };
}
