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
};

export default withMDX(nextConfig);
