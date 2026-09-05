"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Shield } from "@phosphor-icons/react";
import { useExpensesOptional } from "./ExpensesProvider";
import { formatWarrantyStatus, warrantyClaimStatuses } from "../lib/warranty";
import { useDismissable } from "../lib/useDismissable";

// Same "close-in" window WarrantyClaimsTile counts by — inside 30 days is
// genuinely something to act on, not just a stat to glance at.
const EXPIRING_SOON_DAYS = 30;
// Caps how many rows the dropdown lists (worst-first) so one account with
// many tagged items doesn't turn this into an unbounded scroll — the badge
// count above it still reflects the true total either way.
const MAX_LISTED = 8;

export default function WarrantyBell() {
  // null outside an ExpensesProvider (the Settings page uses this same
  // DashboardShell without one) — nothing to show there, so render nothing
  // rather than throw.
  const expenses = useExpensesOptional();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useDismissable(open, rootRef, useCallback(() => setOpen(false), []));

  const attention = useMemo(() => {
    if (!expenses) return [];
    return expenses
      .flatMap((expense) =>
        warrantyClaimStatuses(expense)
          .filter(({ status }) => status.kind === "expired" || (status.kind === "active" && status.daysLeft <= EXPIRING_SOON_DAYS))
          .map(({ claim, status }) => ({ expense, claim, status }))
      )
      .sort((a, b) => {
        // Expired first (most worth noticing), then soonest-expiring active.
        if (a.status.kind !== b.status.kind) return a.status.kind === "expired" ? -1 : 1;
        if (a.status.kind === "active" && b.status.kind === "active") return a.status.daysLeft - b.status.daysLeft;
        return 0;
      });
  }, [expenses]);

  if (!expenses) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={attention.length > 0 ? `${attention.length} warranty items need attention` : "Warranty items"}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-[33px] w-[33px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
      >
        <Bell size={15} weight="light" />
        {attention.length > 0 && (
          <span className="tabular absolute -right-[3px] -top-[3px] flex h-[15px] min-w-[15px] items-center justify-center rounded-pill bg-amber px-[3px] text-[9px] font-semibold text-on-primary">
            {attention.length > 9 ? "9+" : attention.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-[280px] overflow-hidden rounded-md border border-hairline bg-canvas shadow-lg"
        >
          <div className="border-b border-hairline px-[13px] py-[9px]">
            <p className="text-[12px] font-medium text-ink">Warranty</p>
          </div>
          {attention.length === 0 ? (
            <p className="px-[13px] py-[19px] text-center text-[12px] text-ink-mute">
              Nothing expired or expiring soon.
            </p>
          ) : (
            <ul className="flex max-h-[280px] flex-col divide-y divide-hairline overflow-y-auto">
              {attention.slice(0, MAX_LISTED).map(({ expense, claim, status }) => (
                <li key={claim.key} className="flex items-start gap-[8px] px-[13px] py-[9px]">
                  <Shield
                    size={13}
                    weight="fill"
                    className={`mt-[2px] shrink-0 ${status.kind === "expired" ? "text-error" : "text-amber"}`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-ink">{claim.label}</p>
                    <p className="text-[11px] text-ink-mute">
                      {expense.merchant} · {formatWarrantyStatus(status)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {attention.length > MAX_LISTED && (
            <p className="px-[13px] py-[6px] text-[11px] text-ink-mute">
              +{attention.length - MAX_LISTED} more
            </p>
          )}
          <Link
            href="/receipts"
            onClick={() => setOpen(false)}
            className="block border-t border-hairline px-[13px] py-[9px] text-center text-[12px] font-medium text-primary hover:underline"
          >
            View all receipts
          </Link>
        </div>
      )}
    </div>
  );
}
