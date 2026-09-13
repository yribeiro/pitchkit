"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect, type ReactNode } from "react";

/**
 * Initialised once at module load (client-only). `capture_pageview` is off
 * because the App Router doesn't fire a full navigation per route change —
 * `PageviewTracker` below captures `$pageview` manually on pathname/query
 * changes instead. `api_host` points at the /ingest rewrite in
 * next.config.ts, not at PostHog directly, so requests aren't blocked by
 * ad-blockers that target posthog.com by hostname.
 */
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
  });
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams.toString();
    posthog.capture("$pageview", {
      $current_url: query ? `${window.origin}${pathname}?${query}` : `${window.origin}${pathname}`,
    });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}
