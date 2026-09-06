/**
 * Builds the file set for the "Open in StackBlitz / CodeSandbox" buttons:
 * a minimal Vite + React + TypeScript project with the example's source
 * dropped in verbatim. Every example is already a standalone file (issue
 * #17's architecture), so this is purely mechanical.
 *
 * Note: the generated project depends on `@pitchkit/core`/`@pitchkit/react`
 * from npm, which don't publish until Milestone 3 — until then the sandbox
 * opens with the right shape but fails to resolve those two packages.
 * Everything else about the wiring is final.
 */

// Mirrors components/examples/docs-appearance.ts (examples import it as
// "./docs-appearance") — inlined here because the registry only carries
// each example's own source.
const DOCS_APPEARANCE_SOURCE = `import type { PitchAppearance } from "@pitchkit/core";

/** The docs site's shared pitch appearance. */
export const docsAppearance: PitchAppearance = {
  stripes: true,
  goalType: "box",
};
`;

// Mirrors components/examples/docs-pitch-theme.css: PitchKit theming is CSS
// variables only, so the sandbox carries the same --pitch-* theme the docs
// preview renders with.
const STYLES_SOURCE = `:root {
  --pitch-surface: #0f3d24;
  --pitch-stripe: rgba(255, 255, 255, 0.045);
  --pitch-lines: rgba(255, 255, 255, 0.85);
  --pitch-marker-primary: #38bdf8;
  --pitch-marker-goal: #fb923c;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #09090b;
  font-family: system-ui, sans-serif;
}

#root {
  width: min(90vw, 40rem);
}
`;

/** Derives the example's exported component name from its kebab-case registry name. */
function toPascalCase(kebabName: string): string {
  return kebabName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function buildSandboxFiles(name: string, source: string): Record<string, string> {
  const componentName = toPascalCase(name);

  return {
    "package.json": `${JSON.stringify(
      {
        name: `pitchkit-example-${name}`,
        private: true,
        type: "module",
        scripts: { dev: "vite", build: "tsc && vite build" },
        dependencies: {
          "@pitchkit/core": "latest",
          "@pitchkit/react": "latest",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
        devDependencies: {
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
          "@vitejs/plugin-react": "^4.3.0",
          typescript: "^5.6.0",
          vite: "^6.0.0",
        },
      },
      null,
      2,
    )}\n`,
    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PitchKit — ${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "vite.config.ts": `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [react()] });
`,
    "tsconfig.json": `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["src"],
      },
      null,
      2,
    )}\n`,
    "src/main.tsx": `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ${componentName} } from "./example";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <${componentName} />
  </StrictMode>,
);
`,
    "src/example.tsx": `${source}\n`,
    "src/docs-appearance.ts": DOCS_APPEARANCE_SOURCE,
    "src/styles.css": STYLES_SOURCE,
  };
}
