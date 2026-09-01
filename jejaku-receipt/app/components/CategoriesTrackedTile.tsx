"use client";

import { useState } from "react";
import { Tag } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import Select from "./Select";
import { formatCurrency } from "../lib/expenses";
import { useDefaultCurrency, useExpenses } from "./ExpensesProvider";
import { RANGE_OPTIONS, monthsInRange, recentMonths } from "../lib/dateRange";
import { colorForCategory } from "../lib/categoryColors";

export default function CategoriesTrackedTile() {
  const expenses = useExpenses();
  const currency = useDefaultCurrency();
  const [range, setRange] = useState(RANGE_OPTIONS[0]);

  const monthKeys = new Set(recentMonths(monthsInRange(range)).map((m) => m.key));
  const inRange = expenses.filter((e) => monthKeys.has(e.date.slice(0, 7)));

  const totalsByCategory = new Map<string, { count: number; spent: number }>();
  for (const e of inRange) {
    const entry = totalsByCategory.get(e.category) ?? { count: 0, spent: 0 };
    entry.count += 1;
    entry.spent += e.homeCurrencyAmount ?? 0;
    totalsByCategory.set(e.category, entry);
  }

  const ranked = [...totalsByCategory.entries()].sort((a, b) => b[1].spent - a[1].spent);
  const maxSpent = Math.max(1, ...ranked.map(([, v]) => v.spent));

  return (
    <div className="min-w-0 rounded-lg border border-hairline bg-canvas p-[20px]">
      <div className="flex flex-wrap items-start justify-between gap-[8px]">
        <IconFlowBadge size={40} seed={3}>
          <Tag size={16} weight="light" />
        </IconFlowBadge>
        <div className="w-[124px] shrink-0">
          <Select value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
      </div>
      <p className="mt-[12px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
        Categories Tracked
      </p>
      <p className="mt-[3px] text-[15px] font-light tracking-[-0.16px] text-ink">
        {ranked.length}
      </p>
      <p className="mt-[3px] text-[11px] leading-relaxed text-ink-mute">
        {ranked.length > 0
          ? "Distinct categories you've used."
          : "Categories build up as you add expenses."}
      </p>

      {ranked.length > 0 && (
        <div className="mt-[15px] flex flex-col gap-[9px]">
          {ranked.map(([category, { count, spent }]) => (
            <div key={category}>
              <div className="flex items-center justify-between gap-[8px] text-[11px]">
                <span className="min-w-0 truncate text-ink">{category}</span>
                <span className="shrink-0 tabular text-ink-mute">
                  {formatCurrency(spent, currency)} · {count}
                </span>
              </div>
              <div className="mt-[4px] h-[4px] overflow-hidden rounded-pill bg-canvas-soft">
                <div
                  className="h-full rounded-pill"
                  style={{
                    width: `${Math.max(4, (spent / maxSpent) * 100)}%`,
                    backgroundColor: colorForCategory(category),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
