export function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

export type Expense = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  note?: string;
  photoUrl?: string;
  createdAt: string;
};
