export const DEFAULT_CURRENCY = "USD";

// Formats with the actual symbol/placement for the given ISO 4217 code
// (e.g. "RM21.20" for MYR, "$21.20" for USD) instead of always assuming a
// US dollar sign — callers should NOT prepend their own "$" to this.
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    // Unrecognized/invalid ISO code — fall back rather than throw.
    return `${currency} ${amount.toFixed(2)}`;
  }
}

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

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

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
  note?: string;
  photoUrl?: string;
  location?: string;
  currency?: string;
  homeCurrencyAmount?: number;
  homeCurrencyCode?: string;
  items?: ExpenseItem[];
  createdAt: string;
};
