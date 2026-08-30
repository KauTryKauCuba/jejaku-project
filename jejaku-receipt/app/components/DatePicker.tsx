"use client";

import { useCallback, useRef, useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useDismissable } from "../lib/useDismissable";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

function todayKey() {
  const t = new Date();
  return toDateKey(t.getFullYear(), t.getMonth(), t.getDate());
}

function formatLabel(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DatePicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const { year, month } = parseDateKey(value || todayKey());
    return { year, month };
  });
  const rootRef = useRef<HTMLDivElement>(null);

  const openPicker = () => {
    const { year, month } = parseDateKey(value || todayKey());
    setCursor({ year, month });
    setOpen(true);
  };

  useDismissable(
    open,
    rootRef,
    useCallback(() => setOpen(false), [])
  );

  const { year, month } = cursor;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const changeMonth = (delta: number) => {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex w-full items-center justify-between rounded-sm border border-hairline-input bg-canvas px-[11px] py-[8px] text-left text-[14px] text-ink outline-none transition-colors focus:border-primary"
      >
        {value ? formatLabel(value) : "Select date"}
        <CalendarBlank size={14} weight="light" className="shrink-0 text-ink-mute" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-[260px] rounded-md border border-hairline bg-canvas p-[15px] shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-medium text-ink">{monthLabel}</h4>
            <div className="flex items-center gap-[4px]">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
                className="flex h-[24px] w-[24px] items-center justify-center rounded-md text-ink-mute transition-colors hover:bg-canvas-soft"
              >
                <CaretLeft size={12} weight="light" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
                className="flex h-[24px] w-[24px] items-center justify-center rounded-md text-ink-mute transition-colors hover:bg-canvas-soft"
              >
                <CaretRight size={12} weight="light" />
              </button>
            </div>
          </div>

          <div className="mt-[11px] grid grid-cols-7 gap-[2px] text-center">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="text-[10px] font-medium uppercase text-ink-mute">
                {w}
              </div>
            ))}

            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dateKey = toDateKey(year, month, day);
              const isSelected = dateKey === value;
              const isToday = dateKey === todayKey();

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(dateKey);
                    setOpen(false);
                  }}
                  className={
                    isSelected
                      ? "flex aspect-square items-center justify-center rounded-md bg-primary text-[12px] font-medium text-on-primary"
                      : isToday
                        ? "flex aspect-square items-center justify-center rounded-md border border-primary text-[12px] font-medium text-primary"
                        : "flex aspect-square items-center justify-center rounded-md text-[12px] text-ink transition-colors hover:bg-canvas-soft"
                  }
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-[11px] flex items-center justify-between border-t border-hairline pt-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-[12px] font-medium text-ink-mute transition-colors hover:text-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(todayKey());
                setOpen(false);
              }}
              className="text-[12px] font-medium text-primary"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
