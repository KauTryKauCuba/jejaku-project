"use client";

import { useState } from "react";
import { ChartBar, ChartDonut, ChartLineUp, GridFour, TrendDown, TrendUp } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import { formatCurrency } from "../lib/expenses";
import { useDefaultCurrency, useExpenses } from "./ExpensesProvider";
import Select from "./Select";
import { RANGE_OPTIONS, monthsInRange, monthKey, recentMonths } from "../lib/dateRange";
import { colorForCategory } from "../lib/categoryColors";

type View = "bar" | "donut" | "heatmap";
const VIEWS: { id: View; label: string; icon: typeof ChartBar }[] = [
  { id: "bar", label: "Bar", icon: ChartBar },
  { id: "donut", label: "Donut", icon: ChartDonut },
  { id: "heatmap", label: "Heatmap", icon: GridFour },
];

const DONUT_SIZE = 160;
const DONUT_STROKE = 22;
const DONUT_PADDING = 6;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2 - DONUT_PADDING;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const MONTH_GAP = 3; // gap between months' worth of arc, both chart forms
const CATEGORY_GAP = 0.6; // smaller gap between categories within one month

// Overall tile footprint (25% bigger than the original 52px flat tile), the
// gap between the small per-category boxes packed inside it, and the size
// range those boxes scale across.
const HEATMAP_TILE = 65;
const HEATMAP_BOX_GAP = 3;
const HEATMAP_BOX_MIN = 8;
const HEATMAP_BOX_MAX = 28;

// Github-style: one small square per category present that month, sized by
// its spend so bigger amounts read as bigger boxes. Area (not side length)
// scales with amount — sqrt keeps the size difference visually proportional
// to the value instead of exaggerating it — against the biggest single
// category amount anywhere in the visible range, so a box is comparable
// across months, not just within one tile.
function heatmapBoxSize(amount: number, maxAmount: number) {
  if (maxAmount <= 0) return HEATMAP_BOX_MIN;
  const ratio = Math.sqrt(amount / maxAmount);
  return HEATMAP_BOX_MIN + ratio * (HEATMAP_BOX_MAX - HEATMAP_BOX_MIN);
}

// 6 months reads better as a 3x2 grid than the leftover-heavy 4+2 split
// `min(4, months.length)` would otherwise produce; every other range
// (1, 3, 12) already tiles evenly at up to 4 columns.
function heatmapColumns(monthCount: number): number {
  if (monthCount === 6) return 3;
  return Math.min(4, monthCount);
}


export default function MonthlyTrendTile() {
  const expenses = useExpenses();
  const currency = useDefaultCurrency();
  const [hovered, setHovered] = useState<number | null>(null);
  const [range, setRange] = useState(RANGE_OPTIONS[2]);
  const [view, setView] = useState<View>("bar");
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

  const monthSegments = (key: string) => {
    const byCategory = byMonthCategory.get(key);
    return categoryOrder
      .map((category) => ({ category, amount: byCategory?.get(category) ?? 0 }))
      .filter((s) => s.amount > 0);
  };
  const clearHover = (i: number) => setHovered((h) => (h === i ? null : h));

  // Biggest single category amount anywhere in the visible range — the
  // heatmap scales each category's box against this so box size stays
  // comparable across months, not just within one tile.
  const maxCategoryAmount = Math.max(
    1,
    ...months.flatMap((m) => monthSegments(m.key).map((s) => s.amount))
  );

  const rangeTotal = months.reduce((s, m) => s + (totalsByMonth.get(m.key) ?? 0), 0);

  // Donut/segmented show the exact same per-category composition as Bar —
  // not one flat color per month — so each month contributes one arc/block
  // *per category*, not just one for its single biggest category. A bigger
  // gap separates months; a hairline gap separates categories within the
  // same month, so the grouping still reads at a glance.
  type Arc = { monthIndex: number; category: string; dashLength: number; offset: number };
  const arcs: Arc[] = [];
  {
    let cumulative = 0;
    months.forEach((m, mi) => {
      monthSegments(m.key).forEach((s, si) => {
        const rawLength = (s.amount / (rangeTotal || 1)) * DONUT_CIRCUMFERENCE;
        const gap = si === 0 ? MONTH_GAP : CATEGORY_GAP;
        arcs.push({ monthIndex: mi, category: s.category, dashLength: Math.max(0, rawLength - gap), offset: -cumulative });
        cumulative += rawLength;
      });
    });
  }

  // Same tooltip content Bar already shows on hover — month total plus its
  // full category breakdown — reused by Donut/Segmented so all three
  // views surface identical detail, just via a different mark shape.
  const monthTooltip = (mi: number) => {
    const m = months[mi];
    const total = totalsByMonth.get(m.key) ?? 0;
    const segments = monthSegments(m.key);
    return (
      <>
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
              <span className="ml-auto pl-[8px] tabular text-ink">{formatCurrency(s.amount, currency)}</span>
            </p>
          ))}
      </>
    );
  };

  return (
    <div className="flex h-full min-w-0 flex-col rounded-lg border border-hairline bg-canvas p-[20px]">
      <div className="flex flex-wrap items-start justify-between gap-[8px]">
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

      <div className="mt-[11px] ml-auto flex w-fit items-center gap-[2px] rounded-pill border border-hairline-input p-[2px]">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            aria-pressed={view === id}
            aria-label={`${label} view`}
            className={
              view === id
                ? "flex h-[24px] w-[28px] items-center justify-center rounded-pill bg-primary text-on-primary"
                : "flex h-[24px] w-[28px] items-center justify-center rounded-pill text-ink-mute transition-colors hover:bg-canvas-soft"
            }
          >
            <Icon size={13} weight={view === id ? "fill" : "light"} />
          </button>
        ))}
      </div>

      {view === "bar" && (
        <div className="relative mt-[8px] flex min-h-[120px] flex-1 items-stretch gap-[6px]">
          {months.map((m, i) => {
            const total = totalsByMonth.get(m.key) ?? 0;
            const segments = monthSegments(m.key);
            const heightPct = Math.max(4, (total / maxTotal) * 100);

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
                    onMouseLeave={() => clearHover(i)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => clearHover(i)}
                    aria-label={`${m.label}: ${formatCurrency(total, currency)}`}
                    className="flex w-full max-w-[28px] flex-col justify-end gap-[2px] transition-opacity hover:opacity-80"
                    style={{ height: `${heightPct}%` }}
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
      )}

      {view === "donut" && (
        <div className="relative mt-[15px] flex justify-center">
          {hovered !== null && (
            <div className="absolute bottom-[calc(100%+6px)] left-1/2 z-10 flex w-max -translate-x-1/2 flex-col gap-[3px] whitespace-nowrap rounded-sm border border-hairline bg-canvas px-[9px] py-[7px] text-[11px] shadow-lg">
              {monthTooltip(hovered)}
            </div>
          )}
          <svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
            <g transform={`rotate(-90 ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}>
              {arcs.map((a, ai) => {
                const isHovered = hovered === a.monthIndex;
                return (
                  <circle
                    key={ai}
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    r={DONUT_RADIUS}
                    fill="none"
                    stroke={colorForCategory(a.category)}
                    strokeWidth={isHovered ? DONUT_STROKE + 4 : DONUT_STROKE}
                    strokeDasharray={`${a.dashLength} ${DONUT_CIRCUMFERENCE - a.dashLength}`}
                    strokeDashoffset={a.offset}
                    strokeLinecap="round"
                    opacity={hovered !== null && !isHovered ? 0.35 : 1}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHovered(a.monthIndex)}
                    onMouseLeave={() => clearHover(a.monthIndex)}
                  />
                );
              })}
            </g>
            <text x="50%" y="47%" textAnchor="middle" className="fill-ink" style={{ fontSize: 15 }}>
              {formatCurrency(hovered !== null ? totalsByMonth.get(months[hovered].key) ?? 0 : rangeTotal, currency)}
            </text>
            <text x="50%" y="60%" textAnchor="middle" className="fill-ink-mute" style={{ fontSize: 10 }}>
              {hovered !== null ? months[hovered].label : "This range"}
            </text>
          </svg>
        </div>
      )}

      {view === "heatmap" && (
        <div className="mt-[15px] flex flex-1 flex-col items-center justify-center gap-[11px]">
          <div
            className="grid w-fit gap-[4px]"
            style={{ gridTemplateColumns: `repeat(${heatmapColumns(months.length)}, 1fr)` }}
          >
            {months.map((m, mi) => {
              const total = totalsByMonth.get(m.key) ?? 0;
              const segments = monthSegments(m.key);

              return (
                <div key={m.key} className="relative flex flex-col items-center gap-[4px]">
                  {hovered === mi && (
                    <div className="absolute bottom-[calc(100%+6px)] left-1/2 z-10 flex w-max -translate-x-1/2 flex-col gap-[3px] whitespace-nowrap rounded-sm border border-hairline bg-canvas px-[9px] py-[7px] text-[11px] shadow-lg">
                      {monthTooltip(mi)}
                    </div>
                  )}
                  {/* Github-style: one small square per category, each sized
                      by its own spend — not a proportional stack — same
                      colors and tooltip as Bar so all three views still
                      read as one system. */}
                  <button
                    type="button"
                    onMouseEnter={() => setHovered(mi)}
                    onMouseLeave={() => clearHover(mi)}
                    onFocus={() => setHovered(mi)}
                    onBlur={() => clearHover(mi)}
                    aria-label={`${m.label}: ${formatCurrency(total, currency)}`}
                    className="flex items-center justify-center transition-transform hover:scale-[1.1]"
                    style={{ minHeight: HEATMAP_TILE, width: HEATMAP_TILE }}
                  >
                    {segments.length === 0 ? (
                      <div className="h-[52px] w-[52px] rounded-[6px] bg-canvas-soft" />
                    ) : (
                      <div
                        className="flex flex-wrap content-center justify-center"
                        style={{ gap: HEATMAP_BOX_GAP, width: HEATMAP_TILE }}
                      >
                        {segments.map((s) => {
                          const size = heatmapBoxSize(s.amount, maxCategoryAmount);
                          return (
                            <div
                              key={s.category}
                              className="shrink-0 rounded-[2px]"
                              style={{
                                height: size,
                                width: size,
                                backgroundColor: colorForCategory(s.category),
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </button>
                  <span className="text-[10px] text-ink-mute">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
