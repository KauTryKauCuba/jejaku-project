"use client";

import { useState } from "react";
import { DEFAULT_CURRENCY, type Expense, type SplitData } from "../lib/expenses";
import { useUpdateExpense } from "./ExpensesProvider";
import Modal from "./Modal";
import SplitBillSection from "./SplitBillSection";

const EMPTY_SPLIT: SplitData = { people: [], assignments: [] };

export default function SplitBillModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const updateExpense = useUpdateExpense();
  const [split, setSplit] = useState<SplitData>(expense.split ?? EMPTY_SPLIT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSave = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await updateExpense(expense.id, {
        merchant: expense.merchant,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        tax: expense.tax,
        isWarrantyClaim: expense.isWarrantyClaim,
        note: expense.note,
        city: expense.city,
        state: expense.state,
        country: expense.country,
        currency: expense.currency,
        items: expense.items,
        split,
      });
      onClose();
    } catch {
      setError("Couldn't save the split. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Split bill" onClose={onClose}>
      <p className="mb-[11px] text-[12px] text-ink-mute">
        {expense.merchant} · {expense.items?.length ?? 0} item{expense.items?.length === 1 ? "" : "s"}
      </p>
      {error && <p className="mb-[8px] text-[12px] text-error">{error}</p>}
      {(expense.items?.length ?? 0) === 0 ? (
        <p className="text-[12px] text-ink-mute">
          This receipt has no itemized list — edit it to add items before splitting.
        </p>
      ) : (
        <SplitBillSection
          items={expense.items ?? []}
          tax={expense.tax}
          currency={expense.currency ?? DEFAULT_CURRENCY}
          value={split}
          onChange={setSplit}
          alwaysOpen
        />
      )}
      <div className="mt-[15px] flex items-center gap-[8px]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex h-[37px] flex-1 items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save split"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-[37px] items-center justify-center rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
