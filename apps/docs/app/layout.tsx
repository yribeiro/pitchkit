import { Analytics } from "@vercel/analytics/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | PitchKit",
    default: "PitchKit — React football pitch visualisation",
  },
  description:
    "PitchKit is a React-native football pitch visualisation library for the web, with first-class TypeScript types.",
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
