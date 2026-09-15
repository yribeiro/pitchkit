import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { source } from "@/lib/source";
import { AgentLogos, AgentTools } from "@/components/agent-tools";
import { PitchPreview } from "@/components/pitch-preview";

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent components={{ ...defaultMdxComponents, PitchPreview, AgentTools, AgentLogos }} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

/**
 * Per-page canonical + social metadata.
 *
 * Every page here used to return title and description alone, which meant the
 * whole docs tree — ~230 pages — shared the site-wide social card and had no
 * canonical of its own. The canonical matters more than the card: each page is
 * also served as `.md` (see app/llms-md) and listed in the sitemap, so without
 * one an indexer has two plausible URLs for the same content and picks for
 * itself.
 */
export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const { title, description } = page.data;

  return {
    title,
    description,
    alternates: { canonical: page.url },
    openGraph: {
      type: "article",
      siteName: "PitchKit",
      url: `${SITE_URL}${page.url}`,
      title: `${title} | PitchKit`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PitchKit`,
      description,
    },
  };
}
