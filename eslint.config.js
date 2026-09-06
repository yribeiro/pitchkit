// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/.source/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: [
      "packages/react/**/*.tsx",
      "packages/react/**/*.ts",
      "examples/react-nextjs/**/*.tsx",
      "examples/react-nextjs/**/*.ts",
      "apps/docs/**/*.tsx",
      "apps/docs/**/*.ts",
    ],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    // Node-executed build/postbuild scripts, not bundled app code — need
    // Node's globals (URL, process, console, ...), not browser/DOM ones.
    files: ["**/scripts/**/*.mjs", "**/scripts/**/*.js"],
    languageOptions: {
      globals: { URL: "readonly", process: "readonly", console: "readonly" },
    },
  },
  eslintConfigPrettier,
);
