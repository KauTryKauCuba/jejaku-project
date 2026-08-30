"use client";

import { useState, type FormEvent } from "react";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "../lib/expenses";
import Select from "./Select";
import DatePicker from "./DatePicker";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({
  onSubmit,
  onCancel,
  initialDate,
  initialMerchant,
  initialAmount,
  initialCategory,
  disabled = false,
}: {
  onSubmit: (data: {
    merchant: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    note?: string;
  }) => void;
  onCancel: () => void;
  initialDate?: string;
  initialMerchant?: string;
  initialAmount?: number;
  initialCategory?: ExpenseCategory;
  disabled?: boolean;
}) {
  const [merchant, setMerchant] = useState(initialMerchant ?? "");
  const [amount, setAmount] = useState(
    initialAmount !== undefined ? String(initialAmount) : ""
  );
  const [date, setDate] = useState(initialDate ?? today());
  const [category, setCategory] = useState<ExpenseCategory>(
    initialCategory ?? EXPENSE_CATEGORIES[0]
  );
  const [note, setNote] = useState("");
  const [dateError, setDateError] = useState<string | undefined>(undefined);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!date) {
      setDateError("Pick a date.");
      return;
    }
    setDateError(undefined);
    if (!merchant.trim() || Number.isNaN(parsedAmount)) return;
    onSubmit({
      merchant: merchant.trim(),
      amount: parsedAmount,
      date,
      category,
      note: note.trim() || undefined,
    });
  };

  const inputClass =
    "w-full rounded-sm border border-hairline-input bg-canvas px-[11px] py-[8px] text-[14px] text-ink focus:border-primary focus:outline-none";
  const labelClass = "text-[13px] font-medium text-ink";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[11px]">
      <div className="flex flex-col gap-[4px]">
        <label className={labelClass} htmlFor="expense-merchant">
          Merchant
        </label>
        <input
          id="expense-merchant"
          type="text"
          required
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="e.g. Trader Joe's"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-[11px]">
        <div className="flex flex-col gap-[4px]">
          <label className={labelClass} htmlFor="expense-amount">
            Amount
          </label>
          <input
            id="expense-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-[4px]">
          <label className={labelClass} htmlFor="expense-date">
            Date
          </label>
          <DatePicker
            id="expense-date"
            value={date}
            onChange={(value) => {
              setDate(value);
              if (dateError) setDateError(undefined);
            }}
          />
          {dateError && <p className="text-[12px] text-error">{dateError}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass} htmlFor="expense-category">
          Category
        </label>
        <Select
          id="expense-category"
          value={category}
          options={EXPENSE_CATEGORIES}
          onChange={setCategory}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass} htmlFor="expense-note">
          Note <span className="font-normal text-ink-mute">(optional)</span>
        </label>
        <input
          id="expense-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Client lunch"
          className={inputClass}
        />
      </div>

      <div className="mt-[4px] flex items-center gap-[8px]">
        <button
          type="submit"
          disabled={disabled}
          className="flex h-[37px] flex-1 items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {disabled ? "Saving…" : "Save expense"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-[37px] items-center justify-center rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
