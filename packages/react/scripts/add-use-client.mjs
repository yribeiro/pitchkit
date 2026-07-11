// Prepends "use client" to the built ESM output as a plain text step,
// after tsup/esbuild have finished bundling — see the comment in
// tsup.config.ts for why this can't be done via tsup's `banner` option.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const distIndexPath = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const content = readFileSync(distIndexPath, "utf8");

if (!content.startsWith('"use client"')) {
  writeFileSync(distIndexPath, `"use client";\n${content}`);
}
