// Root entry: only the pieces every provider module shares. The actual
// loaders live on per-provider subpaths — `@pitchkit/data-providers/statsbomb`
// today, room for `/skillcorner`, `/metrica`, `/wyscout` later — so importing
// one provider never pulls in code for the others.
export { DataProviderError } from "./errors.js";
export type { DataProviderErrorKind } from "./errors.js";
export { fetchJson } from "./fetch-json.js";
export type { LoadOptions } from "./fetch-json.js";
