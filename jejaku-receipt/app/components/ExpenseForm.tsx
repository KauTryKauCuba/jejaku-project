"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, Plus, Shield, X } from "@phosphor-icons/react";
import {
  EXPENSE_CATEGORIES,
  lineTotal,
  newItem,
  normalizeItems,
  type ExpenseCategory,
  type ExpenseItem,
  type SplitData,
} from "../lib/expenses";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "../lib/currencies";
import { WARRANTY_LENGTH_OPTIONS } from "../lib/warranty";
import { suggestWarrantyMonths } from "../lib/warrantySuggest";

const WARRANTY_NO_LENGTH = "No expiry tracked";
const WARRANTY_LABEL_OPTIONS = [WARRANTY_NO_LENGTH, ...WARRANTY_LENGTH_OPTIONS.map((o) => o.label)] as const;

function warrantyMonthsToLabel(months: number | undefined): (typeof WARRANTY_LABEL_OPTIONS)[number] {
  return WARRANTY_LENGTH_OPTIONS.find((o) => o.months === months)?.label ?? WARRANTY_NO_LENGTH;
}

function warrantyLabelToMonths(label: string): number | undefined {
  return WARRANTY_LENGTH_OPTIONS.find((o) => o.label === label)?.months;
}

// Falls back to USD for a currency outside the app's supported/convertible
// list (e.g. AI-inferred from a receipt, or a user's account default) — the
// Select below can only offer SUPPORTED_CURRENCIES, so seeding it with an
// unlisted code would show a value with no matching, selectable option.
function toSupportedCurrency(code: string): SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code) ? (code as SupportedCurrency) : "USD";
}
import Select from "./Select";
import DatePicker from "./DatePicker";
import { useAddCategory, useCategories, useDefaultCurrency } from "./ExpensesProvider";

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
  initialWarrantyMonths,
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
    warrantyMonths?: number;
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
  initialWarrantyMonths?: number;
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
  const defaultCurrency = useDefaultCurrency();
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
  const [currency, setCurrency] = useState(toSupportedCurrency(initialCurrency ?? defaultCurrency));
  // normalizeItems backfills a stable `id` on any item that arrives
  // without one — a fresh scan's AI-extracted items always do, since
  // DeepSeek's extraction has no concept of it — so every row has one to
  // key its warranty tag (and its React list key) to from the first
  // render, not just after the first save round-trip.
  const [items, setItems] = useState<ExpenseItem[]>(() => normalizeItems(initialItems ?? []));
  const [split, setSplit] = useState<SplitData | undefined>(initialSplit);
  const [tax, setTax] = useState(initialTax !== undefined ? String(initialTax) : "");
  const [isWarrantyClaim, setIsWarrantyClaim] = useState(initialWarrantyClaim ?? false);
  const [warrantyMonths, setWarrantyMonths] = useState<number | undefined>(initialWarrantyMonths);
  const [note, setNote] = useState("");
  const [dateError, setDateError] = useState<string | undefined>(undefined);
  const [taxError, setTaxError] = useState<string | undefined>(undefined);
  const [categoryTouched, setCategoryTouched] = useState(false);
  // Whether Amount is a free-typed value rather than following the items
  // total. Starts unlocked when the form is seeded with existing items (a
  // scan's extracted list, or an existing receipt being edited) so we
  // don't clobber an already-correct printed total with a possibly
  // incomplete item list. The moment the user actively edits an item's
  // price/count themselves, it locks and starts tracking live — see
  // updateItemPrice/addItem/removeItem below.
  const [amountUnlocked, setAmountUnlocked] = useState((initialItems?.length ?? 0) > 0);
  const categories = useCategories();
  const addCategory = useAddCategory();

  const itemsTotal = useMemo(() => {
    const parsedTax = tax.trim() ? parseFloat(tax) : 0;
    const sum = items.reduce((s, i) => s + lineTotal(i), 0) + (Number.isFinite(parsedTax) ? parsedTax : 0);
    return Math.round(sum * 100) / 100;
  }, [items, tax]);

  // Gate on actual priced items, not just item.length>0 — otherwise
  // clicking "Add item" on a blank row (price 0) would instantly lock and
  // zero out an Amount the user had already typed by hand.
  const itemsHavePrice = items.some((i) => i.price !== 0);
  const amountLocked = itemsHavePrice && !amountUnlocked;
  // While locked, the displayed/submitted amount is always the live items
  // total — `amount` state itself is only ever read when unlocked (manual
  // entry), so there's nothing to keep in sync via an effect.
  const displayAmount = amountLocked ? String(itemsTotal) : amount;

  const updateItemName = (index: number, name: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, name } : item)));
  };

  const updateItemPrice = (index: number, priceText: string) => {
    const price = Number(priceText);
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, price: Number.isFinite(price) ? price : 0 } : item))
    );
    setAmountUnlocked(false);
  };

  const updateItemQuantity = (index: number, quantityText: string) => {
    const quantity = Number(quantityText);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1 } : item
      )
    );
    setAmountUnlocked(false);
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
    setAmountUnlocked(false);
  };

  const addItem = () => {
    setItems((prev) => [...prev, newItem()]);
  };

  // Only the two warranty fields — everything else about the item (name,
  // price, quantity) is untouched, and this never flips `amountUnlocked`
  // the way the other item edits above do, since tagging a warranty
  // doesn't change what the receipt actually cost.
  const updateItemWarranty = (index: number, patch: Partial<Pick<ExpenseItem, "isWarrantyClaim" | "warrantyMonths">>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = amountLocked ? itemsTotal : parseFloat(amount);
    const parsedTax = tax.trim() ? parseFloat(tax) : undefined;
    if (!date) {
      setDateError("Pick a date.");
      return;
    }
    setDateError(undefined);
    if (parsedTax !== undefined && Number.isNaN(parsedTax)) {
      setTaxError("That doesn't look like a valid number.");
      return;
    }
    setTaxError(undefined);
    if (!merchant.trim() || Number.isNaN(parsedAmount)) return;
    onSubmit({
      merchant: merchant.trim(),
      amount: parsedAmount,
      date,
      category,
      tax: parsedTax,
      isWarrantyClaim,
      warrantyMonths: isWarrantyClaim ? warrantyMonths : undefined,
      note: note.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      country: country.trim() || undefined,
      items: items.length > 0 ? items : undefined,
      currency,
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
        <div className="flex items-center gap-[8px]">
          <label className={`flex-1 ${labelClass}`}>
            Items <span className="font-normal text-ink-mute">(optional)</span>
          </label>
          {items.length > 0 && (
            <>
              <span className={`w-[52px] shrink-0 text-left ${labelClass}`}>Qty</span>
              <span className={`w-[76px] shrink-0 text-left ${labelClass}`}>
                Price <span className="font-normal text-ink-mute">({currency})</span>
              </span>
              <span className="w-[33px] shrink-0" />
            </>
          )}
        </div>
        {items.length > 0 && (
          <div className="flex flex-col gap-[11px]">
            {items.map((item, i) => {
              const suggestedMonths = suggestWarrantyMonths(item.name);
              return (
                <div key={item.id} className="flex flex-col gap-[4px]">
                  <div className="flex items-center gap-[8px]">
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
                    <div className="w-[52px] shrink-0">
                      <input
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min="1"
                        value={item.quantity ?? 1}
                        onChange={(e) => updateItemQuantity(i, e.target.value)}
                        aria-label={`Item ${i + 1} quantity`}
                        className={`${inputClass} text-center`}
                      />
                    </div>
                    <div className="w-[76px] shrink-0">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateItemPrice(i, e.target.value)}
                        placeholder="0.00"
                        aria-label={`Item ${i + 1} unit price`}
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateItemWarranty(i, {
                          isWarrantyClaim: !item.isWarrantyClaim,
                          // Seed the length with the keyword suggestion the
                          // first time this item is tagged on, so the
                          // reveal below doesn't open on a blank picker —
                          // untouched (left undefined) if untagging.
                          warrantyMonths: !item.isWarrantyClaim ? (item.warrantyMonths ?? suggestedMonths) : item.warrantyMonths,
                        })
                      }
                      aria-pressed={item.isWarrantyClaim ?? false}
                      aria-label={`Tag item ${i + 1} for warranty`}
                      className={
                        item.isWarrantyClaim
                          ? "flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-pill border border-primary bg-primary/10 text-primary transition-colors"
                          : "flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
                      }
                    >
                      <Shield size={14} weight={item.isWarrantyClaim ? "fill" : "light"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      aria-label={`Remove item ${i + 1}`}
                      className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
                    >
                      <X size={14} weight="light" />
                    </button>
                  </div>

                  {item.isWarrantyClaim ? (
                    <div className="ml-[4px] flex flex-col gap-[3px] pl-[24px]">
                      <div className="w-[164px]">
                        <Select
                          value={warrantyMonthsToLabel(item.warrantyMonths)}
                          options={WARRANTY_LABEL_OPTIONS}
                          onChange={(label) => updateItemWarranty(i, { warrantyMonths: warrantyLabelToMonths(label) })}
                        />
                      </div>
                      {item.warrantyMonths !== undefined && item.warrantyMonths === suggestedMonths && (
                        <p className="text-[11px] text-ink-mute">Estimated — check yours.</p>
                      )}
                    </div>
                  ) : (
                    suggestedMonths !== undefined && (
                      <button
                        type="button"
                        onClick={() => updateItemWarranty(i, { isWarrantyClaim: true, warrantyMonths: suggestedMonths })}
                        className="ml-[4px] w-fit pl-[24px] text-left text-[11px] text-primary hover:underline"
                      >
                        Tag for warranty? ~{warrantyMonthsToLabel(suggestedMonths).toLowerCase()}
                      </button>
                    )
                  )}
                </div>
              );
            })}
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
        <div className="flex items-center justify-between gap-[8px]">
          <label className={labelClass} htmlFor="expense-amount">
            Amount
          </label>
          {itemsHavePrice && (
            <button
              type="button"
              onClick={() => setAmountUnlocked((v) => !v)}
              className="text-[12px] font-medium text-primary hover:underline"
            >
              {amountLocked ? "Enter manually" : `Use items total (${itemsTotal})`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-[6px]">
          <div className="w-[88px] shrink-0">
            <Select
              value={currency}
              options={SUPPORTED_CURRENCIES}
              onChange={setCurrency}
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
              readOnly={amountLocked}
              value={displayAmount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={amountLocked ? `${inputClass} cursor-not-allowed bg-canvas-soft` : inputClass}
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
          onChange={(e) => {
            setTax(e.target.value);
            if (taxError) setTaxError(undefined);
          }}
          placeholder="0.00"
          className={inputClass}
        />
        {taxError && <p className="text-[12px] text-error">{taxError}</p>}
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

      <div className="flex flex-col gap-[8px]">
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

        {isWarrantyClaim && (
          <div className="flex flex-col gap-[4px] pl-[24px]">
            <label className="text-[12px] font-medium text-ink-mute" htmlFor="expense-warranty-length">
              Coverage length <span className="font-normal">(optional)</span>
            </label>
            <Select
              id="expense-warranty-length"
              value={warrantyMonthsToLabel(warrantyMonths)}
              options={WARRANTY_LABEL_OPTIONS}
              onChange={(label) => setWarrantyMonths(warrantyLabelToMonths(label))}
            />
          </div>
        )}
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
