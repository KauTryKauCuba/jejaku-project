"use client";

import { useState } from "react";
import { Percent, TrendUp, TrendDown } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import Select from "./Select";
import { formatCurrency, type Expense } from "../lib/expenses";
import { useDefaultCurrency, useExpenses } from "./ExpensesProvider";
import { RANGE_OPTIONS, monthsInRange, recentMonths } from "../lib/dateRange";
import { PERCENT_LIGHT_PATH, iconFillMaskDataUri, iconStrokeMaskDataUri } from "../lib/iconMaskPaths";

// Tax is saved in the expense's own currency, not a home-currency snapshot
// like amount is — so it's converted here using that same expense's
// amount -> homeCurrencyAmount ratio, the FX rate actually captured at
// save time, rather than looking up a fresh (and inconsistent) rate.
function homeCurrencyTax(e: Expense): number {
  if (e.tax === undefined || e.homeCurrencyAmount === undefined || e.amount === 0) return 0;
  return e.tax * (e.homeCurrencyAmount / e.amount);
}

export default function TaxRecordsTile() {
  const expenses = useExpenses();
  const defaultCurrency = useDefaultCurrency();
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const monthsShown = monthsInRange(range);

  const taxByMonth = new Map<string, number>();
  const countByMonth = new Map<string, number>();
  for (const e of expenses) {
    if (e.tax === undefined) continue;
    const key = e.date.slice(0, 7);
    taxByMonth.set(key, (taxByMonth.get(key) ?? 0) + homeCurrencyTax(e));
    countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1);
  }

  const now = new Date();
  const currentWindow = recentMonths(monthsShown, now);
  const previousWindowEnd = new Date(now.getFullYear(), now.getMonth() - monthsShown, 1);
  const previousWindow = recentMonths(monthsShown, previousWindowEnd);

  const currentTotal = currentWindow.reduce((sum, m) => sum + (taxByMonth.get(m.key) ?? 0), 0);
  const previousTotal = previousWindow.reduce((sum, m) => sum + (taxByMonth.get(m.key) ?? 0), 0);
  const currentCount = currentWindow.reduce((sum, m) => sum + (countByMonth.get(m.key) ?? 0), 0);

  const hasComparison = previousTotal > 0;
  const delta = currentTotal - previousTotal;
  const percent = hasComparison ? (delta / previousTotal) * 100 : 0;
  const isUp = delta > 0;

  const allTimeTotal = expenses.reduce((sum, e) => sum + homeCurrencyTax(e), 0);
  const rangeLabel = range === "This month" ? "this month" : `the last ${range}`;
  const detail =
    currentCount === 0
      ? `No tax recorded ${rangeLabel}.`
      : !hasComparison
        ? `From ${currentCount} receipt${currentCount === 1 ? "" : "s"} with tax ${rangeLabel}.`
        : delta === 0
          ? `Same as the period before ${rangeLabel}.`
          : `${isUp ? "Up" : "Down"} ${Math.abs(percent).toFixed(0)}% vs. the period before (${formatCurrency(previousTotal, defaultCurrency)}).`;

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-hairline bg-gradient-to-br from-primary-subdued via-canvas to-canvas p-[20px]">
      <div
        className="pointer-events-none absolute -right-[22px] -top-[26px] h-[132px] w-[132px]"
        style={{
          WebkitMaskImage: iconFillMaskDataUri(PERCENT_LIGHT_PATH),
          maskImage: iconFillMaskDataUri(PERCENT_LIGHT_PATH),
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          backgroundColor: "rgba(29,78,216,0.14)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-[22px] -top-[26px] h-[132px] w-[132px] overflow-hidden"
        style={{
          WebkitMaskImage: iconStrokeMaskDataUri(PERCENT_LIGHT_PATH),
          maskImage: iconStrokeMaskDataUri(PERCENT_LIGHT_PATH),
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
        aria-hidden="true"
      >
        <div
          className="icon-outline-spin absolute inset-[-50%]"
          style={{ background: "conic-gradient(from 0deg, #1d4ed8, #3b82f6, #7fc0e0, #1d4ed8)" }}
        />
      </div>

      <div className="relative flex flex-wrap items-start justify-between gap-[8px]">
        <IconFlowBadge size={40}>
          <Percent size={16} weight="light" />
        </IconFlowBadge>
        <div className="w-[124px] shrink-0">
          <Select value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
      </div>
      <p className="relative mt-[12px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
        Tax Records
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
