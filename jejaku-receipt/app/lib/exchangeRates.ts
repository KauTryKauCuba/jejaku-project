// Frankfurter (https://frankfurter.dev) — free, no API key, ECB-based daily
// rates. Covers ~30 major currencies including USD/MYR/SGD/IDR. Rates only
// update once a day, so a short in-memory cache avoids redundant calls
// within the same server process without needing a real cache layer.

const RATE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const rateCache = new Map<string, { rate: number; fetchedAt: number }>();

// Rate to convert 1 unit of `from` into `to`. Returns null (never throws)
// on any failure — callers must handle a missing rate gracefully rather
// than let an FX outage block saving an expense.
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;

  const cacheKey = `${from}:${to}`;
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < RATE_CACHE_TTL_MS) {
    return cached.rate;
  }

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.[to];
    if (typeof rate !== "number" || !Number.isFinite(rate)) return null;

    rateCache.set(cacheKey, { rate, fetchedAt: Date.now() });
    return rate;
  } catch {
    return null;
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number | null> {
  const rate = await getExchangeRate(from, to);
  return rate === null ? null : amount * rate;
}
