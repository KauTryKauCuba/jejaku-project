"use client";

import {
  Sparkle,
  Camera,
  CurrencyCircleDollar,
  CloudCheck,
  ListChecks,
  Heart,
} from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";

const BENEFITS = [
  {
    icon: Camera,
    title: "No typing",
    body: "Point the camera at a receipt (or a payment confirmation screenshot) and the merchant, amount, date, and items get read automatically.",
  },
  {
    icon: CurrencyCircleDollar,
    title: "Handles more than one currency",
    body: "Scan receipts priced in different currencies and still get one accurate combined total, not a meaningless sum of mismatched numbers.",
  },
  {
    icon: ListChecks,
    title: "Itemized, not just totals",
    body: "Line items and prices are captured too, editable before you save, not just the bottom-line amount.",
  },
  {
    icon: CloudCheck,
    title: "Saved to your account",
    body: "Receipts and expenses live on the server against your account, not just your browser — the same whether you're on your phone or your laptop.",
  },
  {
    icon: Heart,
    title: "Free, no catch",
    body: "A personal project, built to learn and shared for free — not a product built to sell your data or upsell you later.",
  },
];

export default function BenefitsCard() {
  return (
    <div className="min-w-0 rounded-lg border border-hairline bg-canvas p-[20px]">
      <IconFlowBadge size={40} seed={9}>
        <Sparkle size={16} weight="light" />
      </IconFlowBadge>

      <h3 className="mt-[15px] text-[15px] font-light tracking-[-0.19px] text-ink">
        Why use Jejaku Receipt?
      </h3>
      <p className="mt-[4px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        Keeping receipts matters — this is what makes actually doing it painless.
      </p>

      <ul className="mt-[15px] flex flex-col divide-y divide-hairline">
        {BENEFITS.map((benefit) => (
          <li
            key={benefit.title}
            className="flex items-start gap-[11px] py-[11px] first:pt-0 last:pb-0"
          >
            <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-md bg-canvas-soft text-ink-mute">
              <benefit.icon size={14} weight="light" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink">{benefit.title}</p>
              <p className="mt-[2px] text-[12px] leading-relaxed text-ink-mute">
                {benefit.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
