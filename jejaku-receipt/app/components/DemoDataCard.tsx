"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkle } from "@phosphor-icons/react";
import { DEMO_EXPENSES } from "../lib/demoExpenses";

export default function DemoDataCard({ demoCount }: { demoCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const hasDemo = demoCount > 0;

  const handleClick = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = hasDemo
        ? await fetch("/api/expenses/demo", { method: "DELETE" })
        : await fetch("/api/expenses/seed-demo", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-[24px]">
      <div className="flex items-center gap-[8px]">
        <Sparkle size={16} weight="light" className="text-primary" />
        <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">
          Demo data
        </h3>
      </div>
      <p className="mt-[8px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        {hasDemo
          ? `You currently have ${demoCount} sample receipts (spread across March–August) mixed in — remove just those, and anything you've entered yourself stays untouched.`
          : `Load ${DEMO_EXPENSES.length} sample receipts spread across March–August so the dashboard charts have something to show. Safe to add even if you already have real expenses.`}
      </p>
      {error && <p className="mt-[8px] text-[12px] text-error">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="mt-[15px] flex h-[37px] w-fit items-center justify-center rounded-pill border border-hairline-input bg-canvas px-[19px] text-[14px] font-medium text-ink transition-colors hover:bg-canvas-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Working…" : hasDemo ? "Remove demo data" : "Get dummy data"}
      </button>
    </div>
  );
}
