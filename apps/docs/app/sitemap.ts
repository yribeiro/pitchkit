import type { MetadataRoute } from "next";
import { narrativePages } from "@/lib/llms";
import { SITE_URL } from "@/lib/site";
import { source } from "@/lib/source";

/**
 * Static pages, every docs page, and the LLM text files.
 *
 * The `llms*.txt` entries are here so a crawler that only reads the sitemap
 * still discovers them — the convention is new enough that nothing looks for
 * `/llms.txt` by default, and an agent-facing file nobody can find is no
 * better than not having one.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/gallery"].map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const docs = source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const llms = ["/llms.txt", "/llms-full.txt", "/llms-api.txt"].map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Per-page Markdown, the `.md` twin of every narrative page.
  const markdown = narrativePages().map((page) => ({
    url: `${SITE_URL}${page.url}.md`,
    changeFrequency: "weekly" as const,
    priority: 0.3,
  }));

  return [...staticRoutes, ...docs, ...llms, ...markdown];
}
