import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/dimensions/**", "src/transform/**", "src/chart/**", "src/race/**"],
      thresholds: {
        "src/dimensions/**": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/transform/**": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        // The chart scaffold and race maths are the same kind of
        // correctness-critical arithmetic as the transform pipeline, and
        // nothing renders them on the server, so the tests are the only
        // thing standing between a sign error and a wrong chart.
        "src/chart/**": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/race/**": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
