import { defineConfig } from "tsup";

export default defineConfig({
  // Two entries, two `exports` subpaths: a consumer importing only
  // "@pitchkit/data-providers/statsbomb" never pulls in code for providers
  // they don't use. That matters more here than usual, since this package
  // accumulates a provider module per open-data source over time.
  entry: ["src/index.ts", "src/statsbomb/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
});
