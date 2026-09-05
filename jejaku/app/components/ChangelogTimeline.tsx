"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { withWeekday } from "../lib/formatIso";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type TimelineItem = {
  status: string;
  title: string;
  body: string;
  dateLabel?: string;
  date?: string;
};

type DayGroup = {
  date: string;
  items: TimelineItem[];
};

function groupByDate(items: TimelineItem[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const item of items) {
    const date = item.date ?? "Up next";
    const existing = groups[groups.length - 1]?.date === date ? groups[groups.length - 1] : undefined;
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ date, items: [item] });
    }
  }
  return groups;
}

export default function ChangelogTimeline({ items }: { items: TimelineItem[] }) {
  const groups = groupByDate(items);
  // Most recent day open by default (last in the chronological list) —
  // everything older starts collapsed so the page reads as a scannable
  // list of days rather than one long scroll of every shipped item.
  const [openDate, setOpenDate] = useState<string | null>(
    groups.length > 0 ? groups[groups.length - 1].date : null
  );

  return (
    <div className="relative pl-[30px]">
      <div className="absolute left-[4px] top-[10px] bottom-[10px] w-px bg-ink-mute" />

      {groups.map((group, i) => {
        const isOpen = openDate === group.date;
        return (
          <div key={group.date} className={i === groups.length - 1 ? "relative" : "relative mb-[19px]"}>
            <span className="absolute -left-[30px] top-[9px] h-[9px] w-[9px] rounded-full bg-primary" />
            <button
              type="button"
              onClick={() => setOpenDate((prev) => (prev === group.date ? null : group.date))}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-[8px] py-[4px] text-left"
            >
              <span className="tabular text-[13px] font-medium text-ink">
                {ISO_DATE_PATTERN.test(group.date) ? withWeekday(group.date) : group.date}
              </span>
              <span className="text-[12px] text-ink-mute">
                {group.items.length} {group.items.length === 1 ? "update" : "updates"}
              </span>
              <CaretDown
                size={12}
                weight="bold"
                className={`ml-auto shrink-0 text-ink-mute transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="mt-[15px] flex flex-col gap-[23px] border-l border-hairline pl-[19px]">
                {group.items.map((item) => (
                  <div key={item.title}>
                    <div className="flex items-center gap-[8px]">
                      <p className="text-[12px] font-medium uppercase tracking-[0.1px] text-ink-mute">
                        {item.status}
                      </p>
                      {item.dateLabel && (
                        <span className="rounded-pill bg-canvas-soft px-[8px] py-[2px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
                          {item.dateLabel}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-[8px] text-[16px] font-medium text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-[8px] max-w-xl text-[14px] leading-relaxed text-ink-mute">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
