import { DataProviderError } from "./errors.js";

export interface LoadOptions {
  /**
   * Fetch implementation to use instead of the global one. Injecting is how
   * this package's own tests avoid touching the network, and it's the hook
   * for a Next.js caching wrapper or a Node agent with a proxy configured.
   */
  readonly fetch?: typeof globalThis.fetch;
  /** Forwarded to the underlying request, so callers can cancel a slow load. */
  readonly signal?: AbortSignal;
}

/**
 * GET a URL and parse it as JSON, translating every failure mode into a
 * {@link DataProviderError} with a `kind` the caller can branch on.
 *
 * Deliberately built on the global `fetch` rather than an HTTP client, which
 * is what keeps this package at zero runtime dependencies.
 */
export async function fetchJson<T = unknown>(url: string, options: LoadOptions = {}): Promise<T> {
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
    response = await doFetch(url, { signal: options.signal });
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

  if (!response.ok) {
    throw new DataProviderError("http", `${url} returned HTTP ${response.status}.`, {
      url,
      status: response.status,
    });
  }

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new DataProviderError("parse", `${url} did not return valid JSON.`, { url, cause });
  }
}
