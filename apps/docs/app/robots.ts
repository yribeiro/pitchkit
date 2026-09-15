import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Every crawler that matters, named explicitly rather than left to the
 * wildcard.
 *
 * A bare `User-agent: *` already permits all of these — nothing here changes
 * what is technically allowed. They are spelled out because several of these
 * agents are governed by opt-*out* conventions (`Google-Extended`,
 * `Applebot-Extended`) where silence is ambiguous and a future blanket
 * `Disallow` added for one bad bot would otherwise sweep them up with it.
 * Being listed by name is the durable signal that AI answer engines are
 * welcome to read and cite this site.
 */
const AI_CRAWLERS = [
  // OpenAI: training, search index, and on-demand fetch for a user's question.
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic: same three roles.
  "ClaudeBot",
  "anthropic-ai",
  "Claude-User",
  "Claude-SearchBot",
  // Google's AI-products opt-out token — distinct from Googlebot, which
  // handles ordinary web search and is covered by the wildcard.
  "Google-Extended",
  // Apple's equivalent opt-out token.
  "Applebot-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "meta-externalagent",
  "Bytespider",
  "Amazonbot",
  "cohere-ai",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // The docs search endpoint returns JSON keyed by query string; there is
      // nothing there to index and every distinct `?query=` looks like a
      // separate URL to a crawler.
      { userAgent: "*", allow: "/", disallow: "/api/" },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
