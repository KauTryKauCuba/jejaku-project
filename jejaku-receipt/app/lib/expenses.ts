export const DEFAULT_CURRENCY = "USD";

// Always renders the ISO 4217 code (e.g. "USD 21.20", "MYR 21.20") rather
// than a currency symbol — Intl's symbol style is inconsistent across
// codes (some resolve to "$", others silently fall back to the code
// anyway), which reads as a formatting bug when currencies are mixed in
// the same list. The code is unambiguous everywhere.
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "code",
    }).format(amount);
  } catch {
    // Unrecognized/invalid ISO code — fall back rather than throw.
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// The built-in category set. Users can add their own on top of these (stored on
// users.customCategories) — so a category is no longer a closed union, just a
// string that's either one of these or one of the user's own.
export const EXPENSE_CATEGORIES = [
  "Food & Drink",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Health",
  "Entertainment",
  "Other",
] as const;

export type ExpenseCategory = string;

export const MAX_CUSTOM_CATEGORIES = 20;
export const MAX_CATEGORY_LENGTH = 24;

export type ExpenseItem = {
  name: string;
  price: number;
};

export type Expense = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  tax?: number;
  isDemo?: boolean;
  isWarrantyClaim?: boolean;
  note?: string;
  photoUrl?: string;
  location?: string;
  currency?: string;
  homeCurrencyAmount?: number;
  homeCurrencyCode?: string;
  items?: ExpenseItem[];
  createdAt: string;
};
