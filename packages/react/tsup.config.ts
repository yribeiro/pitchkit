import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  external: ["react", "react-dom"],
  // "use client" is added by scripts/add-use-client.mjs as a postbuild
  // step, not via tsup's `banner` option — esbuild silently drops banner
  // text that looks like a directive prologue when bundling ESM (it
  // doesn't count as a "real" directive since it wasn't in the source),
  // so `banner: { js: '"use client";' }` produces a bundle with no
  // directive at all despite emitting no error, only a build-log warning.
  // This is orthogonal to SSR support either way — React still renders
  // "use client" components to a string on the server; the directive only
  // matters for RSC bundlers (e.g. Next.js App Router) that need the
  // client boundary marked.
});
