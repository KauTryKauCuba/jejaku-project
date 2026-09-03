"use client";

import { formatCurrency } from "../lib/expenses";

// Shared "share of a whole" chart pieces — a donut, a single segmented bar,
// and their legend — used by both CategoriesTrackedTile (entries = spend
// per category) and MonthlyTrendTile (entries = spend per month). Kept as
// one shared implementation rather than two near-identical ones so both
// tiles always look and behave the same way, on purpose.

export type ShareEntry = { key: string; label: string; color: string; value: number };

const DONUT_SIZE = 160;
const DONUT_STROKE = 22;
// Room between the ring's outer edge and the SVG's own boundary — without
// it, the ring sits exactly tangent to the viewBox and the hover state
// (which grows the stroke) pushes past it and gets clipped.
const DONUT_PADDING = 6;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2 - DONUT_PADDING;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const SEGMENT_GAP = 3; // px gap between adjacent segments, both chart forms

export function pctOf(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

export function ShareDonut({
  entries,
  total,
  currency,
  hovered,
  onHover,
  onLeave,
  defaultLabel = "Total",
}: {
  entries: ShareEntry[];
  total: number;
  currency: string;
  hovered: string | null;
  onHover: (key: string) => void;
  onLeave: (key: string) => void;
  defaultLabel?: string;
}) {
  const hoveredEntry = hovered ? entries.find((e) => e.key === hovered) : undefined;

  // Running start-offset per segment, computed as a plain pre-pass (not a
  // mutation inside the JSX map below) so each circle's dasharray/offset
  // is a pure function of its precomputed position.
  const arcs: { entry: ShareEntry; dashLength: number; offset: number }[] = [];
  let cumulative = 0;
  for (const e of entries) {
    const rawLength = (e.value / (total || 1)) * DONUT_CIRCUMFERENCE;
    const dashLength = Math.max(0, rawLength - SEGMENT_GAP);
    arcs.push({ entry: e, dashLength, offset: -cumulative });
    cumulative += rawLength;
  }

  return (
    <div className="flex justify-center">
      <svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
        <g transform={`rotate(-90 ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}>
          {arcs.map(({ entry: e, dashLength, offset }) => {
            const isHovered = hovered === e.key;
            return (
              <circle
                key={e.key}
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={DONUT_RADIUS}
                fill="none"
                stroke={e.color}
                strokeWidth={isHovered ? DONUT_STROKE + 4 : DONUT_STROKE}
                strokeDasharray={`${dashLength} ${DONUT_CIRCUMFERENCE - dashLength}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="cursor-pointer transition-all"
                onMouseEnter={() => onHover(e.key)}
                onMouseLeave={() => onLeave(e.key)}
              />
            );
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" className="fill-ink" style={{ fontSize: 15 }}>
          {formatCurrency(hoveredEntry ? hoveredEntry.value : total, currency)}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-ink-mute" style={{ fontSize: 10 }}>
          {hoveredEntry ? hoveredEntry.label : defaultLabel}
        </text>
      </svg>
    </div>
  );
}

export function ShareSegmentedBar({
  entries,
  total,
  currency,
  hovered,
  onHover,
  onLeave,
  defaultLabel = "Total",
}: {
  entries: ShareEntry[];
  total: number;
  currency: string;
  hovered: string | null;
  onHover: (key: string) => void;
  onLeave: (key: string) => void;
  defaultLabel?: string;
}) {
  const hoveredEntry = hovered ? entries.find((e) => e.key === hovered) : undefined;

  return (
    <>
      <p className="text-[12px] text-ink">
        {hoveredEntry ? (
          <>
            {hoveredEntry.label}{" "}
            <span className="tabular text-ink-mute">
              · {formatCurrency(hoveredEntry.value, currency)} ({pctOf(hoveredEntry.value, total).toFixed(0)}%)
            </span>
          </>
        ) : (
          <span className="text-ink-mute">
            {defaultLabel} · <span className="tabular text-ink">{formatCurrency(total, currency)}</span>
          </span>
        )}
      </p>
      <div className="mt-[8px] flex h-[16px] w-full items-stretch gap-[2px] overflow-hidden rounded-pill bg-canvas-soft">
        {entries.map((e) => (
          <div
            key={e.key}
            onMouseEnter={() => onHover(e.key)}
            onMouseLeave={() => onLeave(e.key)}
            className="h-full cursor-pointer transition-opacity"
            style={{
              width: `${pctOf(e.value, total)}%`,
              backgroundColor: e.color,
              opacity: hovered && hovered !== e.key ? 0.35 : 1,
            }}
          />
        ))}
      </div>
    </>
  );
}

export function ShareLegend({
  entries,
  total,
  currency,
  hovered,
  onHover,
  onLeave,
  onToggle,
}: {
  entries: ShareEntry[];
  total: number;
  currency: string;
  hovered: string | null;
  onHover: (key: string) => void;
  onLeave: (key: string) => void;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="mt-[11px] flex flex-col gap-[2px]">
      {entries.map((e) => (
        <button
          key={e.key}
          type="button"
          onMouseEnter={() => onHover(e.key)}
          onMouseLeave={() => onLeave(e.key)}
          onClick={() => onToggle(e.key)}
          className={`flex items-center justify-between gap-[8px] rounded-sm px-[6px] py-[4px] text-left text-[11px] transition-colors ${
            hovered === e.key ? "bg-canvas-soft" : ""
          }`}
        >
          <span className="flex min-w-0 items-center gap-[6px]">
            <span className="h-[8px] w-[8px] shrink-0 rounded-pill" style={{ backgroundColor: e.color }} />
            <span className="min-w-0 truncate text-ink">{e.label}</span>
          </span>
          <span className="shrink-0 tabular text-ink-mute">
            {formatCurrency(e.value, currency)} · {pctOf(e.value, total).toFixed(0)}%
          </span>
        </button>
      ))}
    </div>
  );
}

// Clears the hover only if it's still this key — if the pointer has already
// moved on to a different mark, its own mouseenter may have fired first,
// and clearing unconditionally here would wipe that out instead.
export function makeHoverHandlers(setHovered: (updater: (h: string | null) => string | null) => void) {
  return {
    clearHover: (key: string) => setHovered((h) => (h === key ? null : h)),
    // Pins/unpins a key on tap — the touch equivalent of hover, used by the
    // legend rows' onClick.
    pinHover: (key: string) => setHovered((h) => (h === key ? null : key)),
  };
}
