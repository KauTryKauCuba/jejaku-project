"use client";

import { useState } from "react";
import { ChartLineUp, TrendUp, TrendDown } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import { formatCurrency } from "../lib/expenses";
import { useDefaultCurrency, useExpenses } from "./ExpensesProvider";
import Select from "./Select";
import { RANGE_OPTIONS, monthsInRange, monthKey, recentMonths } from "../lib/dateRange";
import { colorForCategory } from "../lib/categoryColors";

export default function MonthlyTrendTile() {
  const expenses = useExpenses();
  const currency = useDefaultCurrency();
  const [hovered, setHovered] = useState<number | null>(null);
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const monthsShown = monthsInRange(range);

  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisKey = monthKey(now);
  const lastKey = monthKey(lastMonthDate);

  // month key -> category -> spend, plus a flat month total for the scale/headline.
  const byMonthCategory = new Map<string, Map<string, number>>();
  const totalsByMonth = new Map<string, number>();
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + (e.homeCurrencyAmount ?? 0));
    const byCategory = byMonthCategory.get(key) ?? new Map<string, number>();
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + (e.homeCurrencyAmount ?? 0));
    byMonthCategory.set(key, byCategory);
  }

  const thisMonthTotal = totalsByMonth.get(thisKey) ?? 0;
  const lastMonthTotal = totalsByMonth.get(lastKey) ?? 0;

  const hasComparison = lastMonthTotal > 0;
  const delta = thisMonthTotal - lastMonthTotal;
  const percent = hasComparison ? (delta / lastMonthTotal) * 100 : 0;
  const isUp = delta > 0;

  const detail = !hasComparison
    ? "No spending last month to compare."
    : delta === 0
      ? "Same as last month."
      : `${isUp ? "Up" : "Down"} ${Math.abs(percent).toFixed(0)}% vs. last month (${formatCurrency(lastMonthTotal, currency)}).`;

  const months = recentMonths(monthsShown, now);
  const maxTotal = Math.max(1, ...months.map((m) => totalsByMonth.get(m.key) ?? 0));

  // Stable stacking order across the whole range: biggest category anchored
  // at the baseline, smallest at the tip — consistent from bar to bar so a
  // category's slice is always found in the same place.
  const categoryTotals = new Map<string, number>();
  for (const byCategory of byMonthCategory.values()) {
    for (const [category, amount] of byCategory) {
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);
    }
  }
  const categoryOrder = [...categoryTotals.entries()].sort((a, b) => a[1] - b[1]).map(([c]) => c);

  return (
    <div className="flex h-full flex-col rounded-lg border border-hairline bg-canvas p-[20px]">
      <div className="flex items-start justify-between gap-[8px]">
        <IconFlowBadge size={40} seed={6}>
          <ChartLineUp size={16} weight="light" />
        </IconFlowBadge>
        <div className="w-[124px] shrink-0">
          <Select value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
      </div>
      <p className="mt-[12px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
        Monthly Trend
      </p>
      <p className="mt-[3px] flex items-center gap-[4px] text-[15px] font-light tracking-[-0.16px] text-ink">
        {formatCurrency(thisMonthTotal, currency)}
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

      <div className="relative mt-[19px] flex min-h-[120px] flex-1 items-stretch gap-[6px]">
        {months.map((m, i) => {
          const byCategory = byMonthCategory.get(m.key);
          const total = totalsByMonth.get(m.key) ?? 0;
          const segments = categoryOrder
            .map((category) => ({ category, amount: byCategory?.get(category) ?? 0 }))
            .filter((s) => s.amount > 0);

          return (
            <div key={m.key} className="flex min-w-0 flex-1 flex-col items-center gap-[6px]">
              <div className="relative flex w-full flex-1 items-end justify-center">
                {hovered === i && (
                  <div className="absolute bottom-[calc(100%+6px)] z-10 flex w-max flex-col gap-[3px] whitespace-nowrap rounded-sm border border-hairline bg-canvas px-[9px] py-[7px] text-[11px] shadow-lg">
                    <p className="font-medium text-ink">
                      {m.label} · {formatCurrency(total, currency)}
                    </p>
                    {segments.length > 0 &&
                      [...segments].reverse().map((s) => (
                        <p key={s.category} className="flex items-center gap-[6px] text-ink-mute">
                          <span
                            className="h-[6px] w-[6px] shrink-0 rounded-full"
                            style={{ backgroundColor: colorForCategory(s.category) }}
                          />
                          {s.category}
                          <span className="ml-auto pl-[8px] tabular text-ink">
                            {formatCurrency(s.amount, currency)}
                          </span>
                        </p>
                      ))}
                  </div>
                )}
                <div
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered((h) => (h === i ? null : h))}
                  aria-label={`${m.label}: ${formatCurrency(total, currency)}`}
                  className="flex w-full max-w-[28px] flex-col justify-end gap-[2px] transition-opacity hover:opacity-80"
                  style={{ height: `${Math.max(4, (total / maxTotal) * 100)}%` }}
                >
                  {segments.length === 0 ? (
                    <div className="h-full w-full rounded-t-[4px] bg-canvas-soft" />
                  ) : (
                    segments.map((s, si) => (
                      <div
                        key={s.category}
                        className={si === 0 ? "w-full rounded-t-[4px]" : "w-full"}
                        style={{
                          height: `${(s.amount / total) * 100}%`,
                          backgroundColor: colorForCategory(s.category),
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
              <span className="text-[10px] text-ink-mute">{m.label}</span>
            </div>
          );
        })}
      </div>

      {categoryOrder.length > 0 && (
        <div className="mt-[15px] flex flex-wrap gap-x-[11px] gap-y-[6px] border-t border-hairline pt-[11px]">
          {[...categoryOrder].reverse().map((category) => (
            <span key={category} className="flex items-center gap-[5px] text-[10px] text-ink-mute">
              <span
                className="h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ backgroundColor: colorForCategory(category) }}
              />
              {category}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
