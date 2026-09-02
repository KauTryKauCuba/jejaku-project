"use client";

import { useState, type FormEvent } from "react";
import { Check, Plus, Shield, X } from "@phosphor-icons/react";
import { DEFAULT_CURRENCY, EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseItem, type SplitData } from "../lib/expenses";
import Select from "./Select";
import DatePicker from "./DatePicker";
import { useAddCategory, useCategories } from "./ExpensesProvider";

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
  initialCity,
  initialState,
  initialCountry,
  initialItems,
  initialCurrency,
  initialTax,
  initialWarrantyClaim,
  initialSplit,
  categorySource,
  disabled = false,
}: {
  onSubmit: (data: {
    merchant: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    tax?: number;
    isWarrantyClaim?: boolean;
    note?: string;
    city?: string;
    state?: string;
    country?: string;
    items?: ExpenseItem[];
    currency?: string;
    split?: SplitData;
  }) => void;
  onCancel: () => void;
  initialDate?: string;
  initialMerchant?: string;
  initialAmount?: number;
  initialCategory?: ExpenseCategory;
  initialCity?: string;
  initialState?: string;
  initialCountry?: string;
  initialItems?: ExpenseItem[];
  initialCurrency?: string;
  initialTax?: number;
  initialWarrantyClaim?: boolean;
  /** Not editable here — Quick Split lives in its own dedicated flow so it
   * doesn't get mixed up with regular receipt entry/editing. Carried
   * through unchanged (and reindexed if an item is deleted) so editing
   * other fields doesn't silently drop or corrupt an existing split. */
  initialSplit?: SplitData;
  /** Where initialCategory came from — shows a hint next to the Category field so the
   * user knows to double-check an AI guess, or that detection failed and it defaulted. */
  categorySource?: "ai" | "fallback";
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
  const [city, setCity] = useState(initialCity ?? "");
  const [state, setState] = useState(initialState ?? "");
  const [country, setCountry] = useState(initialCountry ?? "");
  const [currency, setCurrency] = useState(initialCurrency ?? DEFAULT_CURRENCY);
  const [items, setItems] = useState<ExpenseItem[]>(initialItems ?? []);
  const [split, setSplit] = useState<SplitData | undefined>(initialSplit);
  const [tax, setTax] = useState(initialTax !== undefined ? String(initialTax) : "");
  const [isWarrantyClaim, setIsWarrantyClaim] = useState(initialWarrantyClaim ?? false);
  const [note, setNote] = useState("");
  const [dateError, setDateError] = useState<string | undefined>(undefined);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const categories = useCategories();
  const addCategory = useAddCategory();

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
    setSplit((prev) =>
      prev
        ? {
            ...prev,
            assignments: prev.assignments
              .filter((a) => a.itemIndex !== index)
              .map((a) => (a.itemIndex > index ? { ...a, itemIndex: a.itemIndex - 1 } : a)),
          }
        : prev
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", price: 0 }]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    const parsedTax = tax.trim() ? parseFloat(tax) : undefined;
    if (!date) {
      setDateError("Pick a date.");
      return;
    }
    setDateError(undefined);
    if (!merchant.trim() || Number.isNaN(parsedAmount)) return;
    if (parsedTax !== undefined && Number.isNaN(parsedTax)) return;
    onSubmit({
      merchant: merchant.trim(),
      amount: parsedAmount,
      date,
      category,
      tax: parsedTax,
      isWarrantyClaim,
      note: note.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      country: country.trim() || undefined,
      items: items.length > 0 ? items : undefined,
      currency: currency.trim().toUpperCase() || undefined,
      split,
    });
  };

  const inputClass =
    "h-[37px] w-full rounded-sm border border-hairline-input bg-canvas px-[11px] text-[14px] text-ink focus:border-primary focus:outline-none";
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
        <label className={labelClass}>
          Location <span className="font-normal text-ink-mute">(optional)</span>
        </label>
        <div className="flex items-center gap-[8px]">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              aria-label="City"
              className={inputClass}
            />
          </div>
          <div className="w-[88px] shrink-0">
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              aria-label="State"
              className={inputClass}
            />
          </div>
        </div>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Country"
          aria-label="Country"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <div className="flex items-center justify-between gap-[8px]">
          <label className={labelClass}>
            Items <span className="font-normal text-ink-mute">(optional)</span>
          </label>
          {items.length > 0 && (
            <span className={`mr-[41px] w-[88px] shrink-0 text-left ${labelClass}`}>
              Price <span className="font-normal text-ink-mute">({currency.trim() || DEFAULT_CURRENCY})</span>
            </span>
          )}
        </div>
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
        <label className={labelClass} htmlFor="expense-tax">
          Tax <span className="font-normal text-ink-mute">(optional)</span>
        </label>
        <input
          id="expense-tax"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
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

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass} htmlFor="expense-category">
          Category
        </label>
        <Select
          id="expense-category"
          value={category}
          options={categories}
          onChange={(value) => {
            setCategory(value);
            setCategoryTouched(true);
          }}
          onCreate={addCategory}
          createLabel="Add new category"
        />
        {!categoryTouched && categorySource === "ai" && (
          <p className="text-[12px] text-ink-mute">AI suggested this — check it&apos;s right.</p>
        )}
        {!categoryTouched && categorySource === "fallback" && (
          <p className="text-[12px] text-error">Couldn&apos;t detect a category — this defaulted, please pick one.</p>
        )}
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

      <button
        type="button"
        onClick={() => setIsWarrantyClaim((v) => !v)}
        aria-pressed={isWarrantyClaim}
        className="flex items-center gap-[8px] rounded-md border border-hairline-input bg-canvas px-[11px] py-[9px] text-left transition-colors hover:bg-canvas-soft"
      >
        <span
          className={
            isWarrantyClaim
              ? "flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-sm bg-primary"
              : "h-[16px] w-[16px] shrink-0 rounded-sm border border-hairline-input"
          }
        >
          {isWarrantyClaim && <Check size={11} weight="bold" className="text-on-primary" />}
        </span>
        <Shield size={15} weight="light" className="shrink-0 text-ink-mute" />
        <span className="text-[13px] font-medium text-ink">
          Tag as Warranty Claim
        </span>
      </button>

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
