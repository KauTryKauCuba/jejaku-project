"use client";

import { useCallback, useRef, useState } from "react";
import { Bell } from "@phosphor-icons/react";
import { useDismissable } from "../lib/useDismissable";

// Deliberately has no data source yet. jejaku-receipt's equivalent
// (WarrantyBell) is driven by expiring warranty claims; the tree has no
// people or dates to draw from until the tree itself is built, so this
// renders the empty state only — no badge, since there is nothing to count.
// When relatives land, the reminders this is waiting for are birthdays and
// anniversaries coming up.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useDismissable(open, rootRef, useCallback(() => setOpen(false), []));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-[33px] w-[33px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
      >
        <Bell size={15} weight="light" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-[280px] overflow-hidden rounded-md border border-hairline bg-canvas shadow-lg"
        >
          <div className="border-b border-hairline px-[13px] py-[9px]">
            <p className="text-[12px] font-medium text-ink">Notifications</p>
          </div>
          <p className="px-[13px] py-[19px] text-center text-[12px] text-ink-mute">
            Nothing yet.
          </p>
        </div>
      )}
    </div>
  );
}
