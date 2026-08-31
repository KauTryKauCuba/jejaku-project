"use client";

import { useState } from "react";
import { CurrencyDollar, TrendUp, TrendDown } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import Select from "./Select";
import { formatCurrency } from "../lib/expenses";
import { useDefaultCurrency, useExpenses } from "./ExpensesProvider";
import { RANGE_OPTIONS, monthsInRange, recentMonths } from "../lib/dateRange";

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
    <div className="flex h-full flex-col rounded-lg border border-hairline bg-canvas p-[20px]">
      <div className="flex items-start justify-between gap-[8px]">
        <IconFlowBadge size={40} seed={1}>
          <CurrencyDollar size={16} weight="light" />
        </IconFlowBadge>
        <div className="w-[124px] shrink-0">
          <Select value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
      </div>
      <p className="mt-[12px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
        Total Spent
      </p>
      <p className="mt-[3px] flex items-center gap-[4px] text-[15px] font-light tracking-[-0.16px] text-ink">
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
      <p className="mt-[3px] text-[11px] leading-relaxed text-ink-mute">
        {detail}
      </p>

      <div className="mt-auto flex items-center justify-between gap-[8px] border-t border-hairline pt-[11px]">
        <span className="text-[11px] text-ink-mute">All-time</span>
        <span className="tabular text-[13px] font-medium text-ink">
          {formatCurrency(allTimeTotal, defaultCurrency)}
        </span>
      </div>
    </div>
  );
}
