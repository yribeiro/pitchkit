import { DataProviderError } from "./errors.js";
import type { LoadOptions } from "./fetch-json.js";

/**
 * The shared request path behind every loader: one GET, with each failure mode
 * translated into a {@link DataProviderError} carrying a `kind` to branch on.
 *
 * Split out from `fetchJson` once SkillCorner arrived, because its files are
 * CSV and JSONL rather than JSON, and its tracking files are read with a
 * `Range` header — all of which need the same error handling and none of which
 * want `response.json()`.
 */
export async function request(
  url: string,
  options: LoadOptions = {},
  init: RequestInit = {},
): Promise<Response> {
  const doFetch = options.fetch ?? globalThis.fetch;
  if (typeof doFetch !== "function") {
    throw new DataProviderError(
      "network",
      "No global `fetch` available. Pass one via the `fetch` option (Node 18+ and all modern browsers have it built in).",
      { url },
    );
  }

  let response: Response;
  try {
    response = await doFetch(url, { ...init, signal: options.signal });
  } catch (cause) {
    // In a browser a CORS rejection is indistinguishable from a genuine
    // network error — both surface as an opaque TypeError — so the message
    // has to name both possibilities rather than guess.
    throw new DataProviderError(
      "network",
      `Could not reach ${url}. The URL may be wrong, the network unavailable, or the host may not allow cross-origin requests.`,
      { url, cause },
    );
  }

  // 206 Partial Content is a success for ranged reads; `response.ok` covers it.
  if (!response.ok) {
    throw new DataProviderError("http", `${url} returned HTTP ${response.status}.`, {
      url,
      status: response.status,
    });
  }

  return response;
}

/** GET a URL as text — CSV, JSONL, anything not parsed as JSON. */
export async function fetchText(url: string, options: LoadOptions = {}): Promise<string> {
  const response = await request(url, options);
  try {
    return await response.text();
  } catch (cause) {
    throw new DataProviderError("network", `Could not read the body of ${url}.`, { url, cause });
  }
}
