import { afterEach, describe, expect, it, vi } from "vitest";
import { convertCurrency, getExchangeRate } from "./exchangeRates";

// getExchangeRate keeps an in-memory cache keyed by "from:to" for the life
// of the module — each test below uses its own currency pair so a cached
// result from one test can't leak into another's assertions.
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getExchangeRate", () => {
  it("returns 1 without calling fetch when converting a currency to itself", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getExchangeRate("USD", "USD")).resolves.toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the rate from a successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { MYR: 4.7 } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(getExchangeRate("USD", "MYR")).resolves.toBe(4.7);
  });

  it("caches a successful lookup so a repeat call doesn't refetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { SGD: 1.35 } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await getExchangeRate("USD", "SGD");
    await getExchangeRate("USD", "SGD");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns null (never throws) on a non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);
    await expect(getExchangeRate("USD", "IDR")).resolves.toBeNull();
  });

  it("returns null (never throws) when fetch itself rejects", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getExchangeRate("USD", "EUR")).resolves.toBeNull();
  });

  it("returns null when the response has no rate for the target currency", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(getExchangeRate("USD", "GBP")).resolves.toBeNull();
  });
});

describe("convertCurrency", () => {
  it("multiplies the amount by the fetched rate", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { JPY: 150 } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(convertCurrency(10, "USD", "JPY")).resolves.toBe(1500);
  });

  it("passes an amount through unchanged when converting to the same currency", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(convertCurrency(42, "USD", "USD")).resolves.toBe(42);
  });

  it("returns null rather than a bogus amount when the rate is unavailable", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);
    await expect(convertCurrency(10, "USD", "AUD")).resolves.toBeNull();
  });
});
