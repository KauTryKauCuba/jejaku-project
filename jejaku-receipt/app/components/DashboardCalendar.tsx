"use client";

import { useMemo, useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import { formatCurrency } from "../lib/expenses";
import { useExpenses } from "./ExpensesProvider";
import AddExpenseCard from "./AddExpenseCard";
import IconFlowBadge from "./IconFlowBadge";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayKey() {
  const t = new Date();
  return toDateKey(t.getFullYear(), t.getMonth(), t.getDate());
}

export default function DashboardCalendar() {
  const expenses = useExpenses();
  const [cursor, setCursor] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });
  const [selected, setSelected] = useState(todayKey());
  const [adding, setAdding] = useState(false);

  const totalsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.date, (map.get(e.date) ?? 0) + 1);
    }
    return map;
  }, [expenses]);

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

  const selectDay = (day: number) => {
    setSelected(toDateKey(year, month, day));
    setAdding(false);
  };

  const selectedExpenses = expenses.filter((e) => e.date === selected);
  const selectedLabel = new Date(`${selected}T00:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-[24px]">
      <IconFlowBadge size={40} seed={5}>
        <CalendarBlank size={16} weight="light" />
      </IconFlowBadge>

      <div className="mt-[15px] flex items-center justify-between">
        <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-[4px]">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-ink-mute transition-colors hover:bg-canvas-soft"
          >
            <CaretLeft size={13} weight="light" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-ink-mute transition-colors hover:bg-canvas-soft"
          >
            <CaretRight size={13} weight="light" />
          </button>
        </div>
      </div>

      <div className="mt-[15px] grid grid-cols-7 gap-[4px] text-center">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="text-[10px] font-medium uppercase text-ink-mute"
          >
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateKey = toDateKey(year, month, day);
          const isToday = dateKey === todayKey();
          const isSelected = dateKey === selected;
          const count = totalsByDate.get(dateKey) ?? 0;

          return (
            <button
              key={i}
              type="button"
              onClick={() => selectDay(day)}
              className={
                isSelected
                  ? "relative flex aspect-square items-center justify-center rounded-md bg-primary text-[12px] font-medium text-on-primary"
                  : isToday
                    ? "relative flex aspect-square items-center justify-center rounded-md border border-primary text-[12px] font-medium text-primary"
                    : "relative flex aspect-square items-center justify-center rounded-md text-[12px] text-ink transition-colors hover:bg-canvas-soft"
              }
            >
              {day}
              {count > 0 && (
                <span
                  className={`absolute bottom-[4px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full ${isSelected ? "bg-on-primary" : "bg-primary"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-[19px] border-t border-hairline pt-[19px]">
        <div className="flex flex-wrap items-center justify-between gap-[8px]">
          <p className="text-[13px] font-medium text-ink">{selectedLabel}</p>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="flex h-[28px] shrink-0 items-center justify-center gap-[4px] whitespace-nowrap rounded-pill border border-hairline-input bg-canvas px-[11px] text-[12px] font-medium text-ink transition-colors hover:bg-canvas-soft"
          >
            {adding ? (
              "Cancel"
            ) : (
              <>
                <Plus size={12} weight="light" />
                Add expense
              </>
            )}
          </button>
        </div>

        {adding ? (
          <div className="mt-[15px]">
            <AddExpenseCard
              key={selected}
              initialDate={selected}
              showHeader={false}
              onSaved={() => setAdding(false)}
            />
          </div>
        ) : selectedExpenses.length === 0 ? (
          <p className="mt-[8px] text-[12px] text-ink-mute">
            No expenses logged on this day.
          </p>
        ) : (
          <ul className="mt-[11px] flex flex-col divide-y divide-hairline">
            {selectedExpenses.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-[11px] py-[8px] first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {e.merchant}
                  </p>
                  <p className="text-[11px] text-ink-mute">{e.category}</p>
                </div>
                <p className="tabular shrink-0 text-[13px] font-medium text-ink">
                  {formatCurrency(e.amount, e.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
