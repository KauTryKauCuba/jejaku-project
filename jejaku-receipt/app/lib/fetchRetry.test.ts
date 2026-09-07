import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFetchRetry } from "./fetchRetry";

function networkError(code: string): TypeError {
  const err = new TypeError("fetch failed");
  (err as unknown as { cause: unknown }).cause = { code };
  return err;
}

describe("installFetchRetry", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Clear the idempotency guard between tests so each one installs a
    // fresh wrapper around its own mock.
    delete (globalThis as Record<symbol, unknown>)[Symbol.for("jejaku.fetchRetryInstalled")];
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("retries a network-level failure and returns the eventual success", async () => {
    const mock = vi
      .fn()
      .mockRejectedValueOnce(networkError("EAI_AGAIN"))
      .mockResolvedValueOnce(new Response("ok"));
    globalThis.fetch = mock as unknown as typeof fetch;

    installFetchRetry();
    const promise = fetch("https://example.com");
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(await res.text()).toBe("ok");
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("gives up after maxRetries and throws the last error", async () => {
    const mock = vi.fn().mockRejectedValue(networkError("ECONNRESET"));
    globalThis.fetch = mock as unknown as typeof fetch;

    installFetchRetry(2);
    const promise = fetch("https://example.com");
    // Attach a rejection handler immediately so the eventual rejection
    // (after fake-timer advancement below) is never seen as unhandled.
    const assertion = expect(promise).rejects.toThrow("fetch failed");
    await vi.runAllTimersAsync();
    await assertion;

    expect(mock).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });

  it("does not retry a non-network error, e.g. a plain HTTP error response", async () => {
    const mock = vi.fn().mockResolvedValue(new Response("not found", { status: 404 }));
    globalThis.fetch = mock as unknown as typeof fetch;

    installFetchRetry();
    const res = await fetch("https://example.com");

    expect(res.status).toBe(404);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("does not retry an error with an unrecognized cause code", async () => {
    const mock = vi.fn().mockRejectedValue(networkError("SOME_OTHER_CODE"));
    globalThis.fetch = mock as unknown as typeof fetch;

    installFetchRetry();
    await expect(fetch("https://example.com")).rejects.toThrow("fetch failed");
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("only installs once even if called multiple times", async () => {
    const mock = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = mock as unknown as typeof fetch;

    installFetchRetry();
    const wrapped = globalThis.fetch;
    installFetchRetry();

    expect(globalThis.fetch).toBe(wrapped);
  });
});
