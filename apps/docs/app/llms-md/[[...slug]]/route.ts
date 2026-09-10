import { notFound } from "next/navigation";
import { renderPage } from "@/lib/llms";
import { source } from "@/lib/source";

export const revalidate = false;

/**
 * Serves any docs page as raw Markdown. Reached as `/docs/<path>.md` via the
 * rewrite in next.config.ts, not directly — Next can't match a literal `.md`
 * suffix on a catch-all segment, so the extension is stripped there and the
 * bare slug arrives here.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await renderPage(page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
