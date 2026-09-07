// This VPS's Docker embedded DNS proxy is intermittently unreliable —
// direct queries from the host to 1.1.1.1 are 100% reliable, but the same
// lookup from inside a container fails ~30% of the time (EAI_AGAIN),
// surfacing as a hard "fetch failed" with no HTTP response at all (Google
// OAuth callbacks, Resend emails — anything this app calls out to).
// `fetch` only ever throws for a network-level failure like this; a real
// HTTP error status still resolves normally with `res.ok === false` and
// is untouched here — so retrying a THROWN fetch a couple of times is a
// safe, narrow mitigation, not a blanket "retry everything."
const RETRYABLE_CODES = new Set(["EAI_AGAIN", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"]);

function isRetryableNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const cause = (err as { cause?: unknown }).cause;
  const code = cause && typeof cause === "object" && "code" in cause ? (cause as { code?: unknown }).code : undefined;
  return typeof code === "string" && RETRYABLE_CODES.has(code);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Guarded on globalThis (not a module-level boolean) so it stays
// idempotent even if this module gets evaluated more than once — e.g.
// Next.js dev's hot reload re-running instrumentation.ts.
const INSTALLED_FLAG = Symbol.for("jejaku.fetchRetryInstalled");

export function installFetchRetry(maxRetries = 2) {
  const g = globalThis as typeof globalThis & { [INSTALLED_FLAG]?: boolean };
  if (g[INSTALLED_FLAG]) return;
  g[INSTALLED_FLAG] = true;

  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await originalFetch(input, init);
      } catch (err) {
        if (!isRetryableNetworkError(err) || attempt >= maxRetries) throw err;
        await delay(250 * (attempt + 1));
      }
    }
  }) as typeof fetch;
}
