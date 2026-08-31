"use client";

import { useEffect, useState } from "react";
import { receiptUrl } from "../lib/receiptUrl";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "../lib/currencies";
import Select from "./Select";

export default function DefaultCurrencyForm() {
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(receiptUrl("/api/users/currency"), { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { currency: string }) => {
        if (cancelled) return;
        // Fall back to USD if the stored value somehow isn't one of the
        // currencies this dropdown (and the conversion pipeline) supports.
        const fetched = SUPPORTED_CURRENCIES.find((c) => c === data.currency);
        setCurrency(fetched ?? "USD");
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your current currency.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setStatus(undefined);
    setSaving(true);
    try {
      const res = await fetch(receiptUrl("/api/users/currency"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't update your default currency.");
        return;
      }
      setStatus(
        data.failed > 0
          ? `Saved. ${data.reconverted} expense${data.reconverted === 1 ? "" : "s"} updated in Jejaku Receipt, ${data.failed} couldn't be converted and were left out of totals.`
          : `Saved. ${data.reconverted} expense${data.reconverted === 1 ? "" : "s"} in Jejaku Receipt recalculated in ${data.currency}.`
      );
    } catch {
      setError("Couldn't update your default currency. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[8px]">
      <label className="text-[14px] font-medium text-ink" htmlFor="default-currency">
        Default currency
      </label>
      <p className="text-[12px] leading-relaxed text-ink-mute">
        Used by Jejaku Receipt for Total Spent and Monthly Trend. Individual receipts still
        show their own original currency — this only affects the combined totals.
      </p>
      <div className="flex items-center gap-[8px]">
        <div className="w-[100px]">
          <Select
            id="default-currency"
            value={currency}
            options={SUPPORTED_CURRENCIES}
            onChange={(value) => {
              setCurrency(value);
              if (error) setError(undefined);
            }}
          />
        </div>
        <button
          type="submit"
          disabled={saving || loading}
          className="flex h-[37px] items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-[12px] text-error">{error}</p>}
      {status && <p className="text-[12px] text-ink-mute">{status}</p>}
    </form>
  );
}
