"use client";

import {
  Receipt,
  Buildings,
  ShieldCheck,
  ArrowsCounterClockwise,
  Briefcase,
  Scales,
  Megaphone,
} from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";

const REASONS = [
  {
    icon: Buildings,
    title: "Tax records",
    body: "Most tax authorities expect proof of expenses for years, not months — 3 in the US, 5 in the UK/Australia/Singapore, 7 in Malaysia. Digital copies generally count.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty claims",
    body: "Proof of the purchase date is usually all a repair or replacement claim actually needs.",
  },
  {
    icon: ArrowsCounterClockwise,
    title: "Returns & exchanges",
    body: "Most stores won't process either without seeing the original receipt.",
  },
  {
    icon: Briefcase,
    title: "Expense claims",
    body: "Reimbursement from work or a client almost always needs the receipt attached.",
  },
  {
    icon: Scales,
    title: "Disputes & insurance",
    body: "Proof of what something cost and when, if it's ever lost, damaged, or disputed.",
  },
  {
    icon: Megaphone,
    title: "Recalls & rebates",
    body: "A product recall refund and a mail-in or online rebate both usually ask for proof of purchase.",
  },
];

export default function WhyScanCard() {
  return (
    <div className="rounded-lg border border-hairline bg-canvas p-[20px]">
      <IconFlowBadge size={40} seed={8}>
        <Receipt size={16} weight="light" />
      </IconFlowBadge>

      <h3 className="mt-[15px] text-[15px] font-light tracking-[-0.19px] text-ink">
        Why keep your receipts?
      </h3>
      <p className="mt-[4px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        A scanned receipt isn&apos;t just a record — it&apos;s proof you might actually need.
      </p>

      <ul className="mt-[15px] flex flex-col divide-y divide-hairline">
        {REASONS.map((reason) => (
          <li
            key={reason.title}
            className="flex items-start gap-[11px] py-[11px] first:pt-0 last:pb-0"
          >
            <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-md bg-canvas-soft text-ink-mute">
              <reason.icon size={14} weight="light" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink">{reason.title}</p>
              <p className="mt-[2px] text-[12px] leading-relaxed text-ink-mute">
                {reason.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
