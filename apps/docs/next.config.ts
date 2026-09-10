import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
  async rewrites() {
    return [
      { source: "/docs.md", destination: "/llms-md" },
      { source: "/docs/:slug*.md", destination: "/llms-md/:slug*" },
    ];
  },
};

export default withMDX(nextConfig);
