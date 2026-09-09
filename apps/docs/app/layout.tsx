import { Analytics } from "@vercel/analytics/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const SITE = "https://pitchkitjs.com";
const DESCRIPTION =
  "PitchKit is a React-native football pitch visualisation library for the web, with first-class TypeScript types.";

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
    default: "PitchKit — React football pitch visualisation",
  },
  description: DESCRIPTION,
  applicationName: "PitchKit",
  keywords: [
    "football",
    "soccer",
    "data visualisation",
    "react",
    "mplsoccer",
    "pitch",
    "analytics",
    "statsbomb",
    "opta",
  ],
  authors: [{ name: "Yohahn Ribeiro", url: "https://github.com/yribeiro" }],
  openGraph: {
    type: "website",
    siteName: "PitchKit",
    url: SITE,
    title: "PitchKit — React football pitch visualisation",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "PitchKit — React football pitch visualisation",
    description: DESCRIPTION,
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
        <RootProvider theme={{ defaultTheme: "dark" }}>{children}</RootProvider>
        <Analytics />
      </body>
    </html>
  );
}
