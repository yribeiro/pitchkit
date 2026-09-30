import { Analytics } from "@vercel/analytics/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PostHogProvider } from "@/components/posthog-provider";
import { SEARCH_DESCRIPTION, SITE_URL as SITE, SUBHEAD, TAGLINE, X_HANDLE } from "@/lib/site";
import "./globals.css";

/**
 * `metadataBase` is what lets the file-convention images in this directory
 * (`icon.svg`, `apple-icon.tsx`, `opengraph-image.tsx`) resolve to absolute
 * URLs — social scrapers reject relative ones, so without it every share
 * renders as a bare link.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    template: "%s | PitchKit",
    /*
     * The <title> is the strongest single ranking signal the site has, so it
     * spends its characters on what the library *is* rather than on the
     * tagline. The tagline is not lost: it still opens the page itself, and
     * still fronts every social card below.
     */
    default: "PitchKit — React & TypeScript football visualisation library",
  },
  description: SEARCH_DESCRIPTION,
  applicationName: "PitchKit",
  /*
   * Whole phrases, not single words. The value of this tag is no longer in
   * ranking — Google has ignored it for years — but in handing an LLM crawler
   * a compact, unambiguous statement of what the library competes as.
   */
  keywords: [
    "react library for football",
    "football visualisation library",
    "visualisation library football",
    "charting library for football",
    "football web application library",
    "typescript football visualisations",
    "soccer data visualization react",
    "football pitch react component",
    "shot map react",
    "pass network chart",
    "football analytics javascript",
    "mplsoccer alternative javascript",
    "statsbomb react",
    "skillcorner tracking data",
    "nextjs football charts",
  ],
  category: "technology",
  authors: [{ name: "Yohahn Ribeiro", url: "https://github.com/yribeiro" }],
  creator: "Yohahn Ribeiro",
  alternates: { canonical: "/" },
  /*
   * Social cards carry the landing page's own copy, not the search
   * description: a shared link should preview as the page it opens.
   */
  openGraph: {
    type: "website",
    siteName: "PitchKit",
    url: SITE,
    locale: "en_GB",
    title: `PitchKit — ${TAGLINE}`,
    description: SUBHEAD,
  },
  twitter: {
    card: "summary_large_image",
    site: X_HANDLE,
    creator: X_HANDLE,
    title: `PitchKit — ${TAGLINE}`,
    description: SUBHEAD,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/*
         * Dark is the default (issue #28's design direction: near-black
         * surface first, Linear/Supabase-style) — visitors can still switch
         * to light or system via the theme toggle.
         */}
        <PostHogProvider>
          <RootProvider theme={{ defaultTheme: "dark" }}>{children}</RootProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
