import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const dirname = path.dirname(fileURLToPath(import.meta.url));

// components/examples/registry.ts and content/docs/api/ are gitignored,
// generated content. They used to be produced by predev/prebuild npm
// hooks, then by chaining them onto the "dev"/"build" npm scripts (see
// git history) — but Vercel's Next.js framework preset runs `next build`
// directly against this app's Root Directory, bypassing package.json's
// "build" script (and any npm lifecycle hooks) entirely. Running the
// generator scripts here, at the top of next.config.ts, is the one place
// that runs no matter what invokes Next.
for (const script of ["generate-examples-registry.mjs", "generate-api-docs.mjs"]) {
  execFileSync(process.execPath, [path.join(dirname, "scripts", script)], { stdio: "inherit" });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives nested under a repo-root sibling package-lock.json (the
  // monorepo root) *and* has its own resolved lockfile in this worktree;
  // pin the root explicitly so Turbopack doesn't guess wrong between them.
  turbopack: {
    root: path.join(dirname, "../.."),
  },
  // Append `.md` to any docs URL to get the raw Markdown. A route segment can't
  // carry a literal `.md` suffix alongside a catch-all, so the extension is
  // stripped here and the bare slug handed to app/llms-md/[[...slug]].
  //
  // The /ingest/* rules proxy PostHog analytics through this domain (PostHog's
  // documented Next.js reverse-proxy pattern) so browser ad-blockers that
  // target posthog.com/eu.i.posthog.com by hostname don't strip the requests.
  // Pinned to EU Cloud endpoints to match where the project actually lives —
  // swap both hosts if the PostHog project ever moves region.
  async rewrites() {
    return [
      { source: "/docs.md", destination: "/llms-md" },
      { source: "/docs/:slug*.md", destination: "/llms-md/:slug*" },
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      { source: "/ingest/:path*", destination: "https://eu.i.posthog.com/:path*" },
      { source: "/ingest/decide", destination: "https://eu.i.posthog.com/decide" },
    ];
  },
  // Required alongside the /ingest proxy above — PostHog's /decide endpoint
  // is sensitive to an auto-inserted trailing-slash redirect.
  skipTrailingSlashRedirect: true,
  // The skill page moved out of Configuration when Agents became its own
  // section. The old URL is already published in @pitchkit/react 0.3.0's
  // README on npm, where it can't be edited — that tarball is immutable — so
  // this has to keep working regardless of what the site does next.
  async redirects() {
    return [
      {
        source: "/docs/configuration/agent-skill",
        destination: "/docs/agents/skills",
        permanent: true,
      },
      // Styling was consolidated into one section; the old URLs are linked from outside the site.
      { source: "/docs/guides/theming", destination: "/docs/styling/theming", permanent: true },
      {
        source: "/docs/guides/theming.md",
        destination: "/docs/styling/theming.md",
        permanent: true,
      },
      {
        source: "/docs/configuration/tailwind",
        destination: "/docs/styling/tailwind",
        permanent: true,
      },
      {
        source: "/docs/configuration/tailwind.md",
        destination: "/docs/styling/tailwind.md",
        permanent: true,
      },
      { source: "/docs/guides/recipes", destination: "/gallery", permanent: true },
      { source: "/docs/styling", destination: "/docs/styling/theming", permanent: false },
    ];
  },
};

export default withMDX(nextConfig);
