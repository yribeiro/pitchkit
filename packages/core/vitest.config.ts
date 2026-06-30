import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/dimensions/**", "src/transform/**"],
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
      },
    },
  },
});
