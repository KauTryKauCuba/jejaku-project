"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "@phosphor-icons/react";
import { DEFAULT_CURRENCY, EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseItem } from "../lib/expenses";
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
  initialLocation,
  initialItems,
  initialCurrency,
  disabled = false,
}: {
  onSubmit: (data: {
    merchant: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    note?: string;
    location?: string;
    items?: ExpenseItem[];
    currency?: string;
  }) => void;
  onCancel: () => void;
  initialDate?: string;
  initialMerchant?: string;
  initialAmount?: number;
  initialCategory?: ExpenseCategory;
  initialLocation?: string;
  initialItems?: ExpenseItem[];
  initialCurrency?: string;
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
  const [location, setLocation] = useState(initialLocation ?? "");
  const [currency, setCurrency] = useState(initialCurrency ?? DEFAULT_CURRENCY);
  const [items, setItems] = useState<ExpenseItem[]>(initialItems ?? []);
  const [note, setNote] = useState("");
  const [dateError, setDateError] = useState<string | undefined>(undefined);

  const updateItemName = (index: number, name: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, name } : item)));
  };

  const updateItemPrice = (index: number, priceText: string) => {
    const price = Number(priceText);
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, price: Number.isFinite(price) ? price : 0 } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", price: 0 }]);
  };

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
      location: location.trim() || undefined,
      items: items.length > 0 ? items : undefined,
      currency: currency.trim().toUpperCase() || undefined,
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

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass} htmlFor="expense-location">
          Location <span className="font-normal text-ink-mute">(optional)</span>
        </label>
        <input
          id="expense-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. 123 Main St, Springfield"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>
          Items <span className="font-normal text-ink-mute">(optional)</span>
        </label>
        {items.length > 0 && (
          <div className="flex flex-col gap-[8px]">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-[8px]">
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItemName(i, e.target.value)}
                    placeholder="Item name"
                    aria-label={`Item ${i + 1} name`}
                    className={inputClass}
                  />
                </div>
                <div className="w-[88px] shrink-0">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) => updateItemPrice(i, e.target.value)}
                    placeholder="0.00"
                    aria-label={`Item ${i + 1} price`}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  aria-label={`Remove item ${i + 1}`}
                  className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
                >
                  <X size={14} weight="light" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addItem}
          className="mt-[4px] flex h-[33px] w-fit items-center gap-[6px] rounded-pill border border-hairline-input bg-canvas px-[13px] text-[13px] font-medium text-ink transition-colors hover:bg-canvas-soft"
        >
          <Plus size={14} weight="light" />
          Add item
        </button>
      </div>

      <div className="grid grid-cols-2 gap-[11px]">
        <div className="flex flex-col gap-[4px]">
          <label className={labelClass} htmlFor="expense-amount">
            Amount
          </label>
          <div className="flex items-center gap-[6px]">
            <div className="w-[62px] shrink-0">
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                aria-label="Currency code"
                placeholder={DEFAULT_CURRENCY}
                className={`${inputClass} text-center uppercase`}
              />
            </div>
            <div className="min-w-0 flex-1">
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
          </div>
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
