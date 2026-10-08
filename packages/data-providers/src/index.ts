/**
 * Root entry: only the pieces every provider module shares. The actual
 * loaders live on per-provider subpaths — `/statsbomb`, `/skillcorner`,
 * `/wyscout` and `/metrica` — so importing one provider
 * never pulls in code for the others.
 *
 * `@module` names this entry in the generated API reference; without it
 * TypeDoc falls back to the source path, and the docs URLs end up carrying
 * `packages/data-providers/src/...`.
 *
 * @module index
 */
export { DataProviderError } from "./errors.js";
export type { DataProviderErrorKind } from "./errors.js";
export { fetchJson } from "./fetch-json.js";
export type { LoadOptions } from "./fetch-json.js";
