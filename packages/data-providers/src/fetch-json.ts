import { DataProviderError } from "./errors.js";
import { request } from "./http.js";

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
 * Deliberately built on the global `fetch` rather than an HTTP client — see
 * `http.ts` for the shared request path.
 */
export async function fetchJson<T = unknown>(url: string, options: LoadOptions = {}): Promise<T> {
  const response = await request(url, options);

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new DataProviderError("parse", `${url} did not return valid JSON.`, { url, cause });
  }
}
