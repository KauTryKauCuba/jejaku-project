"use client";

import { useState } from "react";
import { Shield } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import Select from "./Select";
import { useExpenses } from "./ExpensesProvider";
import { RANGE_OPTIONS, monthsInRange, recentMonths } from "../lib/dateRange";
import { SHIELD_LIGHT_PATH, iconFillMaskDataUri, iconStrokeMaskDataUri } from "../lib/iconMaskPaths";

export default function WarrantyClaimsTile() {
  const expenses = useExpenses();
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const monthsShown = monthsInRange(range);

  const monthKeys = new Set(recentMonths(monthsShown).map((m) => m.key));
  const inRange = expenses.filter((e) => e.isWarrantyClaim && monthKeys.has(e.date.slice(0, 7)));
  const allTimeCount = expenses.filter((e) => e.isWarrantyClaim).length;

  const rangeLabel = range === "This month" ? "this month" : `the last ${range}`;

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-hairline bg-gradient-to-br from-amber/25 via-canvas to-canvas p-[20px]">
      <div
        className="pointer-events-none absolute -right-[22px] -top-[26px] h-[132px] w-[132px]"
        style={{
          WebkitMaskImage: iconFillMaskDataUri(SHIELD_LIGHT_PATH),
          maskImage: iconFillMaskDataUri(SHIELD_LIGHT_PATH),
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          backgroundColor: "rgba(232,163,61,0.18)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-[22px] -top-[26px] h-[132px] w-[132px] overflow-hidden"
        style={{
          WebkitMaskImage: iconStrokeMaskDataUri(SHIELD_LIGHT_PATH),
          maskImage: iconStrokeMaskDataUri(SHIELD_LIGHT_PATH),
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
          style={{
            // Amber only — {colors.amber} at varying alpha, not an invented
            // in-between hex or {colors.citrine} (a reserved, unshipped token).
            background:
              "conic-gradient(from 0deg, rgba(232,163,61,1), rgba(232,163,61,0.25), rgba(232,163,61,1))",
          }}
        />
      </div>

      <div className="relative flex flex-wrap items-start justify-between gap-[8px]">
        <IconFlowBadge size={40}>
          <Shield size={16} weight="light" />
        </IconFlowBadge>
        <div className="w-[124px] shrink-0">
          <Select value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
      </div>
      <p className="relative mt-[12px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
        Warranty Claims
      </p>
      <p className="relative mt-[3px] text-[15px] font-light tracking-[-0.16px] text-ink">
        {inRange.length}
      </p>
      <p className="relative mt-[3px] text-[11px] leading-relaxed text-ink-mute">
        {inRange.length > 0
          ? `Tagged ${rangeLabel}.`
          : `Nothing tagged ${rangeLabel}.`}
      </p>

      <div className="relative mt-auto flex items-center justify-between gap-[8px] border-t border-hairline pt-[11px]">
        <span className="text-[11px] text-ink-mute">All-time</span>
        <span className="tabular text-[13px] font-medium text-ink">{allTimeCount}</span>
      </div>
    </div>
  );
}
