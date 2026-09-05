"use client";

import { Camera, Shield, Users } from "@phosphor-icons/react";
import { formatCurrency, lineTotal, type Expense } from "../lib/expenses";
import { withWeekday } from "../lib/formatIso";
import { formatWarrantyStatus, warrantyStatus } from "../lib/warranty";
import Modal from "./Modal";

export default function ReceiptPreviewModal({
  expense,
  receiptNumber,
  onClose,
}: {
  expense: Expense;
  receiptNumber: string;
  onClose: () => void;
}) {
  const status = warrantyStatus(expense);
  const warrantyLabel = formatWarrantyStatus(status);
  const location = [expense.city, expense.state, expense.country].filter(Boolean).join(", ");

  return (
    <Modal title={expense.merchant} onClose={onClose}>
      <p className="tabular text-[11px] text-ink-mute">{receiptNumber}</p>

      {expense.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={expense.photoUrl}
          alt={`Receipt from ${expense.merchant}`}
          className="mt-[11px] max-h-[320px] w-full rounded-lg border border-hairline object-cover"
        />
      ) : (
        <div className="mt-[11px] flex h-[120px] items-center justify-center rounded-lg border border-hairline bg-canvas-soft text-ink-mute">
          <Camera size={22} weight="light" />
        </div>
      )}

      <div className="mt-[15px] flex items-start justify-between gap-[11px]">
        <div className="min-w-0">
          <p className="flex items-center gap-[5px] text-[15px] font-light tracking-[-0.19px] text-ink">
            <span className="truncate">{expense.merchant}</span>
            {expense.isWarrantyClaim && (
              <Shield size={13} weight="fill" className="shrink-0 text-primary" aria-label="Warranty claim" />
            )}
            {expense.split && expense.split.people.length > 0 && (
              <Users
                size={13}
                weight="fill"
                className="shrink-0 text-primary"
                aria-label={`Split ${expense.split.people.length} ways`}
              />
            )}
          </p>
          <p className="mt-[3px] text-[12px] text-ink-mute">
            {expense.category} · {withWeekday(expense.date)}
            {location && ` · ${location}`}
          </p>
        </div>
        <p className="tabular shrink-0 text-[17px] font-light tracking-[-0.19px] text-ink">
          {formatCurrency(expense.amount, expense.currency)}
        </p>
      </div>

      {(expense.tax !== undefined || warrantyLabel || (expense.split && expense.split.people.length > 0)) && (
        <div className="mt-[11px] flex flex-col gap-[6px] border-t border-hairline pt-[11px] text-[12px] text-ink-mute">
          {expense.tax !== undefined && (
            <div className="flex items-center justify-between">
              <span>Tax</span>
              <span className="tabular text-ink">{formatCurrency(expense.tax, expense.currency)}</span>
            </div>
          )}
          {warrantyLabel && (
            <div className="flex items-center justify-between">
              <span>Warranty</span>
              <span className={status.kind === "expired" ? "text-error" : "text-ink"}>{warrantyLabel}</span>
            </div>
          )}
          {expense.split && expense.split.people.length > 0 && (
            <div className="flex items-center justify-between">
              <span>Split</span>
              <span className="text-ink">{expense.split.people.length} ways</span>
            </div>
          )}
        </div>
      )}

      {expense.items && expense.items.length > 0 && (
        <div className="mt-[11px] border-t border-hairline pt-[11px]">
          <p className="text-[11px] font-medium uppercase tracking-[0.1px] text-ink-mute">Items</p>
          <ul className="mt-[8px] flex flex-col divide-y divide-hairline">
            {expense.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-[11px] py-[6px] text-[13px]">
                <span className="min-w-0 truncate text-ink">
                  {item.name}
                  {item.quantity && item.quantity !== 1 && (
                    <span className="text-ink-mute"> ×{item.quantity}</span>
                  )}
                </span>
                <span className="tabular shrink-0 text-ink-mute">
                  {formatCurrency(lineTotal(item), expense.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {expense.note && (
        <div className="mt-[11px] border-t border-hairline pt-[11px]">
          <p className="text-[11px] font-medium uppercase tracking-[0.1px] text-ink-mute">Note</p>
          <p className="mt-[4px] text-[13px] leading-relaxed text-ink">{expense.note}</p>
        </div>
      )}
    </Modal>
  );
}
