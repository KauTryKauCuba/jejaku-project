"use client";

import { ChartLineUp, TrendUp, TrendDown } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import { useExpenses, formatCurrency } from "../lib/expenses";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthlyTrendTile() {
  const expenses = useExpenses();

  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisKey = monthKey(now);
  const lastKey = monthKey(lastMonthDate);

  let thisMonthTotal = 0;
  let lastMonthTotal = 0;
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    if (key === thisKey) thisMonthTotal += e.amount;
    else if (key === lastKey) lastMonthTotal += e.amount;
  }

  const hasComparison = lastMonthTotal > 0;
  const delta = thisMonthTotal - lastMonthTotal;
  const percent = hasComparison ? (delta / lastMonthTotal) * 100 : 0;
  const isUp = delta > 0;

  const detail = !hasComparison
    ? "No spending last month to compare."
    : delta === 0
      ? "Same as last month."
      : `${isUp ? "Up" : "Down"} ${Math.abs(percent).toFixed(0)}% vs. last month ($${formatCurrency(lastMonthTotal)}).`;

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-[16px]">
      <IconFlowBadge size={40} seed={6}>
        <ChartLineUp size={16} weight="light" />
      </IconFlowBadge>
      <p className="mt-[12px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
        Monthly Trend
      </p>
      <p className="mt-[3px] flex items-center gap-[4px] text-[15px] font-light tracking-[-0.16px] text-ink">
        ${formatCurrency(thisMonthTotal)}
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
    </div>
  );
}
