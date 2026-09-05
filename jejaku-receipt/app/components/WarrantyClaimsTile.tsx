"use client";

import { useState } from "react";
import { Shield } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import Select from "./Select";
import { useExpenses } from "./ExpensesProvider";
import { RANGE_OPTIONS, monthsInRange, recentMonths } from "../lib/dateRange";
import { warrantyStatus } from "../lib/warranty";
import { SHIELD_LIGHT_PATH, iconFillMaskDataUri, iconStrokeMaskDataUri } from "../lib/iconMaskPaths";

// Matches the "close-in" window formatWarrantyStatus starts counting in
// days rather than weeks/months — inside 30 days is genuinely something to
// act on now, not just a stat to note.
const EXPIRING_SOON_DAYS = 30;

// A handful of small copies of the same icon scattered behind the big
// watermark, each also doing the globe turn — see the identical set on
// TotalSpentTile for the full rationale (negative delays desync them from
// a shared keyframe; varied durations keep them from ever re-syncing).
const WATERMARK_SATELLITES = [
  { top: 8, right: 96, size: 13, opacity: 0.14, duration: 10, delay: -2 },
  { top: 58, right: 6, size: 17, opacity: 0.12, duration: 16, delay: -6 },
  { top: -8, right: 46, size: 11, opacity: 0.16, duration: 12, delay: -4 },
  { top: 92, right: 60, size: 15, opacity: 0.13, duration: 18, delay: -9 },
  { top: 30, right: 132, size: 10, opacity: 0.15, duration: 9, delay: -1 },
];

export default function WarrantyClaimsTile() {
  const expenses = useExpenses();
  const [range, setRange] = useState(RANGE_OPTIONS[0]);
  const monthsShown = monthsInRange(range);

  const monthKeys = new Set(recentMonths(monthsShown).map((m) => m.key));
  const inRange = expenses.filter((e) => e.isWarrantyClaim && monthKeys.has(e.date.slice(0, 7)));
  const allTimeCount = expenses.filter((e) => e.isWarrantyClaim).length;
  const expiringSoonCount = expenses.filter((e) => {
    const status = warrantyStatus(e);
    return status.kind === "active" && status.daysLeft <= EXPIRING_SOON_DAYS;
  }).length;

  const rangeLabel = range === "This month" ? "this month" : `the last ${range}`;

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-hairline bg-gradient-to-br from-amber/25 via-canvas to-canvas p-[20px]">
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
          <Shield size={s.size} weight="light" color={`rgba(232,163,61,${s.opacity})`} />
        </div>
      ))}

      {/* Wrapper carries the position/size and the spin — the two mask
          layers inside just fill it (inset-0), so rotating this one
          element spins the whole watermark icon as a unit, ring included. */}
      <div className="icon-watermark-spin pointer-events-none absolute -right-[18.7px] -top-[22.1px] h-[112.2px] w-[112.2px]" aria-hidden="true">
        <div
          className="absolute inset-0"
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
        />
        <div
          className="absolute inset-0 overflow-hidden"
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

      <div className="relative mt-auto flex flex-col gap-[6px] border-t border-hairline pt-[11px]">
        <div className="flex items-center justify-between gap-[8px]">
          <span className="text-[11px] text-ink-mute">All-time</span>
          <span className="tabular text-[13px] font-medium text-ink">{allTimeCount}</span>
        </div>
        {expiringSoonCount > 0 && (
          <div className="flex items-center justify-between gap-[8px]">
            <span className="text-[11px] text-ink-mute">Expiring within 30 days</span>
            <span className="tabular text-[13px] font-medium text-amber">{expiringSoonCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
