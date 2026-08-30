"use client";

import { Tray, Camera } from "@phosphor-icons/react";
import { formatCurrency } from "../lib/expenses";
import { useExpenses } from "./ExpensesProvider";

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function RecentReceipts() {
  const expenses = useExpenses();

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-[24px]">
      <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">
        Recent Receipts
      </h3>
      <p className="mt-[4px] text-[12px] text-ink-mute">
        The latest expenses you&apos;ve logged show up here.
      </p>

      {expenses.length === 0 ? (
        <div className="mt-[19px] flex flex-col items-center rounded-md bg-canvas-soft px-[15px] py-[38px] text-center">
          <Tray size={22} weight="light" className="text-ink-mute" />
          <p className="mt-[11px] text-[13px] font-medium text-ink">
            No receipts yet
          </p>
          <p className="mt-[4px] max-w-[26ch] text-[12px] leading-relaxed text-ink-mute">
            Scan or add an expense above and it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <ul className="mt-[15px] flex flex-col divide-y divide-hairline">
          {expenses.slice(0, 8).map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-[11px] py-[11px] first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-[11px]">
                <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-canvas-soft text-ink-mute">
                  {e.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Camera size={14} weight="light" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {e.merchant}
                  </p>
                  <p className="text-[11px] text-ink-mute">
                    {e.category} · {formatDate(e.date)}
                  </p>
                </div>
              </div>
              <p className="tabular shrink-0 text-[13px] font-medium text-ink">
                ${formatCurrency(e.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
