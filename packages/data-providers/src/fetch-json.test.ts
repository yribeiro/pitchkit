import { afterEach, describe, expect, it, vi } from "vitest";
import { DataProviderError } from "./errors.js";
import { fetchJson } from "./fetch-json.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns the parsed body", async () => {
    const fetchStub = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    await expect(fetchJson("https://example.test/a.json", { fetch: fetchStub })).resolves.toEqual({
      ok: true,
    });
    expect(fetchStub).toHaveBeenCalledWith("https://example.test/a.json", { signal: undefined });
  });

  it("forwards an abort signal", async () => {
    const controller = new AbortController();
    const fetchStub = vi.fn(async () => new Response("[]"));
    await fetchJson("https://example.test/a.json", {
      fetch: fetchStub,
      signal: controller.signal,
    });
    expect(fetchStub).toHaveBeenCalledWith("https://example.test/a.json", {
      signal: controller.signal,
    });
  });

  it("uses the global fetch when none is injected", async () => {
    const fetchStub = vi.fn(async () => new Response("[]"));
    vi.stubGlobal("fetch", fetchStub);
    await expect(fetchJson("https://example.test/a.json")).resolves.toEqual([]);
    expect(fetchStub).toHaveBeenCalled();
  });

  it("reports a non-2xx response as kind 'http', carrying the status", async () => {
    const fetchStub = async () => new Response("nope", { status: 404 });
    const error = await fetchJson("https://example.test/missing.json", {
      fetch: fetchStub,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DataProviderError);
    expect((error as DataProviderError).kind).toBe("http");
    expect((error as DataProviderError).status).toBe(404);
    expect((error as DataProviderError).url).toBe("https://example.test/missing.json");
  });

  it("reports a non-JSON body as kind 'parse'", async () => {
    const fetchStub = async () => new Response("<html>not json</html>");
    const error = await fetchJson("https://example.test/page.html", { fetch: fetchStub }).catch(
      (e: unknown) => e,
    );

    expect((error as DataProviderError).kind).toBe("parse");
    expect((error as DataProviderError).message).toMatch(/did not return valid JSON/);
  });

  it("reports a thrown request as kind 'network', naming CORS as a possibility", async () => {
    // A browser reports a CORS rejection as an opaque TypeError, identical
    // to a genuine network failure, so the message has to cover both.
    const cause = new TypeError("Failed to fetch");
    const fetchStub = async () => {
      throw cause;
    };
    const error = await fetchJson("https://example.test/a.json", { fetch: fetchStub }).catch(
      (e: unknown) => e,
    );

    expect((error as DataProviderError).kind).toBe("network");
    expect((error as DataProviderError).message).toMatch(/cross-origin/);
    expect((error as DataProviderError).cause).toBe(cause);
  });

  it("explains itself when no fetch exists at all", async () => {
    vi.stubGlobal("fetch", undefined);
    const error = await fetchJson("https://example.test/a.json").catch((e: unknown) => e);

    expect((error as DataProviderError).kind).toBe("network");
    expect((error as DataProviderError).message).toMatch(/No global `fetch`/);
  });
});
