/**
 * Every failure this package raises, so a consumer can `catch` one type and
 * still tell the cases apart via `kind`. The demo app in
 * `examples/react-nextjs` leans on exactly this: a bad URL, a 404, a CORS
 * rejection and "valid JSON, but not the file you thought" all need
 * distinguishable messages, and a bare `Error` can't carry that.
 */
export type DataProviderErrorKind =
  /** The request never completed: bad URL, offline, DNS, or blocked by CORS. */
  | "network"
  /** The request completed with a non-2xx status. */
  | "http"
  /** The response body wasn't valid JSON. */
  | "parse"
  /** Valid JSON, but not the shape this parser expects. */
  | "schema";

export class DataProviderError extends Error {
  readonly kind: DataProviderErrorKind;
  readonly url?: string;
  readonly status?: number;

  constructor(
    kind: DataProviderErrorKind,
    message: string,
    options: { url?: string; status?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "DataProviderError";
    this.kind = kind;
    this.url = options.url;
    this.status = options.status;
  }
}
