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
  async rewrites() {
    return [
      { source: "/docs.md", destination: "/llms-md" },
      { source: "/docs/:slug*.md", destination: "/llms-md/:slug*" },
    ];
  },
};

export default withMDX(nextConfig);
