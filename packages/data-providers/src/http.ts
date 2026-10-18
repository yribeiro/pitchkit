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

/**
 * Yield a response body line by line as it arrives, without the trailing
 * `\n`. Leaving the loop early cancels the reader, which aborts the download
 * rather than letting the rest arrive unread.
 *
 * Falls back to reading the whole body when there is no stream (a mocked
 * fetch, or a runtime without WHATWG streams).
 */
export async function* streamLines(response: Response): AsyncGenerator<string, void, undefined> {
  const body = response.body;
  if (!body) {
    const text = await response.text();
    yield* text.split("\n");
    return;
  }

  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffered = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });
      // Walk an index rather than re-slicing the buffer per line: a chunk
      // can hold hundreds of short lines, and copying the remainder each
      // time is quadratic in the chunk size.
      let start = 0;
      let newline = buffered.indexOf("\n", start);
      while (newline !== -1) {
        yield buffered.slice(start, newline);
        start = newline + 1;
        newline = buffered.indexOf("\n", start);
      }
      buffered = buffered.slice(start);
    }
    buffered += decoder.decode();
    if (buffered !== "") yield buffered;
  } finally {
    // Runs on `break` too, which is what stops the download.
    await reader.cancel().catch(() => undefined);
  }
}
