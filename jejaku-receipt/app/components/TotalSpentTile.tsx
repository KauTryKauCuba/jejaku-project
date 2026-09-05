"use client";

import { useState } from "react";
import { CurrencyDollar, TrendUp, TrendDown } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import Select from "./Select";
import { formatCurrency } from "../lib/expenses";
import { useDefaultCurrency, useExpenses } from "./ExpensesProvider";
import { RANGE_OPTIONS, monthsInRange, recentMonths } from "../lib/dateRange";
import { CURRENCY_DOLLAR_LIGHT_PATH, iconFillMaskDataUri, iconStrokeMaskDataUri } from "../lib/iconMaskPaths";

// EXPERIMENT (Total Spent only, for now): a handful of small copies of the
// same icon scattered behind the big watermark, each also doing the globe
// turn. Negative `delay` values start each one mid-turn rather than at
// frame zero — with five instances all sharing the exact same keyframe,
// starting them in sync would read as one wobbling blob instead of
// independent icons; different durations keep them from ever re-syncing
// later, either. Sizes/opacities stay low so they read as background
// texture, not competing with the real watermark for attention.
const WATERMARK_SATELLITES = [
  { top: 8, right: 96, size: 13, opacity: 0.14, duration: 10, delay: -2 },
  { top: 58, right: 6, size: 17, opacity: 0.12, duration: 16, delay: -6 },
  { top: -8, right: 46, size: 11, opacity: 0.16, duration: 12, delay: -4 },
  { top: 92, right: 60, size: 15, opacity: 0.13, duration: 18, delay: -9 },
  { top: 30, right: 132, size: 10, opacity: 0.15, duration: 9, delay: -1 },
];

export default function TotalSpentTile() {
  const expenses = useExpenses();
  const defaultCurrency = useDefaultCurrency();
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const monthsShown = monthsInRange(range);

  const totalsByMonth = new Map<string, number>();
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + (e.homeCurrencyAmount ?? 0));
  }

  const now = new Date();
  const currentWindow = recentMonths(monthsShown, now);
  // The equal-length window immediately before the current one, for the
  // "vs previous period" comparison — e.g. for "3 months" that's the 3
  // months before the current 3-month window, not just the prior month.
  const previousWindowEnd = new Date(now.getFullYear(), now.getMonth() - monthsShown, 1);
  const previousWindow = recentMonths(monthsShown, previousWindowEnd);

  const currentTotal = currentWindow.reduce((sum, m) => sum + (totalsByMonth.get(m.key) ?? 0), 0);
  const previousTotal = previousWindow.reduce((sum, m) => sum + (totalsByMonth.get(m.key) ?? 0), 0);

  const hasComparison = previousTotal > 0;
  const delta = currentTotal - previousTotal;
  const percent = hasComparison ? (delta / previousTotal) * 100 : 0;
  const isUp = delta > 0;

  const allTimeTotal = expenses.reduce((sum, e) => sum + (e.homeCurrencyAmount ?? 0), 0);
  const rangeLabel = range === "This month" ? "this month" : `the last ${range}`;
  const detail = expenses.length === 0
    ? "Across every receipt you've scanned."
    : !hasComparison
      ? `Nothing logged in the period before ${rangeLabel} to compare.`
      : delta === 0
        ? `Same as the period before ${rangeLabel}.`
        : `${isUp ? "Up" : "Down"} ${Math.abs(percent).toFixed(0)}% vs. the period before (${formatCurrency(previousTotal, defaultCurrency)}).`;

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-hairline bg-gradient-to-br from-purple/25 via-canvas to-canvas p-[20px]">
      {/* Rendered before the big watermark below, so it paints on top of
          these — that's what puts them "behind" it, not a z-index. */}
      {WATERMARK_SATELLITES.map((s, i) => (
        <div
          key={i}
          className="icon-watermark-spin pointer-events-none absolute"
          style={{
            top: s.top,
            right: s.right,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
          aria-hidden="true"
        >
          <CurrencyDollar size={s.size} weight="light" color={`rgba(147,51,234,${s.opacity})`} />
        </div>
      ))}

      {/* Wrapper carries the position/size and the spin — the two mask
          layers inside just fill it (inset-0), so rotating this one
          element spins the whole watermark icon as a unit, ring included. */}
      <div className="icon-watermark-spin pointer-events-none absolute -right-[18.7px] -top-[22.1px] h-[112.2px] w-[112.2px]" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            WebkitMaskImage: iconFillMaskDataUri(CURRENCY_DOLLAR_LIGHT_PATH),
            maskImage: iconFillMaskDataUri(CURRENCY_DOLLAR_LIGHT_PATH),
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            backgroundColor: "rgba(147,51,234,0.18)",
          }}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage: iconStrokeMaskDataUri(CURRENCY_DOLLAR_LIGHT_PATH),
            maskImage: iconStrokeMaskDataUri(CURRENCY_DOLLAR_LIGHT_PATH),
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        >
          <div
            className="icon-outline-spin absolute inset-[-50%]"
            style={{
              // Purple only — {colors.purple}, this card's dedicated accent;
              // see DESIGN.md.
              background:
                "conic-gradient(from 0deg, rgba(147,51,234,1), rgba(147,51,234,0.3), rgba(147,51,234,1))",
            }}
          />
        </div>
      </div>

      <div className="relative flex flex-wrap items-start justify-between gap-[8px]">
        <IconFlowBadge size={40} seed={1}>
          <CurrencyDollar size={16} weight="light" />
        </IconFlowBadge>
        <div className="w-[124px] shrink-0">
          <Select value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
      </div>
      <p className="relative mt-[12px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
        Total Spent
      </p>
      <p className="relative mt-[3px] flex items-center gap-[4px] text-[15px] font-light tracking-[-0.16px] text-ink">
        {formatCurrency(currentTotal, defaultCurrency)}
        {hasComparison && delta !== 0 && (
          <span className="text-ink-mute">
            {isUp ? (
              <TrendUp size={13} weight="bold" />
            ) : (
              <TrendDown size={13} weight="bold" />
            )}
          </span>
        )}
      </p>
      <p className="relative mt-[3px] text-[11px] leading-relaxed text-ink-mute">
        {detail}
      </p>

      <div className="relative mt-auto flex items-center justify-between gap-[8px] border-t border-hairline pt-[11px]">
        <span className="text-[11px] text-ink-mute">All-time</span>
        <span className="tabular text-[13px] font-medium text-ink">
          {formatCurrency(allTimeTotal, defaultCurrency)}
        </span>
      </div>
    </div>
  );
}
