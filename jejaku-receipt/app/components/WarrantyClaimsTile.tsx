"use client";

import { useState } from "react";
import { Shield } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import Select from "./Select";
import { useExpenses } from "./ExpensesProvider";
import { RANGE_OPTIONS, monthsInRange, recentMonths } from "../lib/dateRange";

export default function WarrantyClaimsTile() {
  const expenses = useExpenses();
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const monthsShown = monthsInRange(range);

  const monthKeys = new Set(recentMonths(monthsShown).map((m) => m.key));
  const inRange = expenses.filter((e) => e.isWarrantyClaim && monthKeys.has(e.date.slice(0, 7)));
  const allTimeCount = expenses.filter((e) => e.isWarrantyClaim).length;

  const rangeLabel = range === "This month" ? "this month" : `the last ${range}`;

  return (
    <div className="flex h-full min-w-0 flex-col rounded-lg border border-hairline bg-canvas p-[20px]">
      <div className="flex flex-wrap items-start justify-between gap-[8px]">
        <IconFlowBadge size={40} seed={5}>
          <Shield size={16} weight="light" />
        </IconFlowBadge>
        <div className="w-[124px] shrink-0">
          <Select value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
      </div>
      <p className="mt-[12px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
        Warranty Claims
      </p>
      <p className="mt-[3px] text-[15px] font-light tracking-[-0.16px] text-ink">
        {inRange.length}
      </p>
      <p className="mt-[3px] text-[11px] leading-relaxed text-ink-mute">
        {inRange.length > 0
          ? `Tagged ${rangeLabel}.`
          : `Nothing tagged ${rangeLabel}.`}
      </p>

      <div className="mt-auto flex items-center justify-between gap-[8px] border-t border-hairline pt-[11px]">
        <span className="text-[11px] text-ink-mute">All-time</span>
        <span className="tabular text-[13px] font-medium text-ink">{allTimeCount}</span>
      </div>
    </div>
  );
}
