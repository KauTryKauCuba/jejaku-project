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

// Which people share each line item — itemIndex refers into the expense's
// `items` array. An item can be shared by more than one person (its price
// splits evenly among everyone assigned to it); an item with nobody
// assigned isn't included in anyone's total. Tax is distributed
// proportionally to each person's item subtotal.
export type SplitAssignment = {
  itemIndex: number;
  people: string[];
};

export type SplitData = {
  people: string[];
  assignments: SplitAssignment[];
};

// Parses the `split` FormData field posted by ExpenseForm. Malformed input
// degrades to no split rather than rejecting the whole expense submission
// over a non-essential field — same as `items` beside it.
export function parseSplit(raw: FormDataEntryValue | null): SplitData | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray(parsed.people) ||
      !parsed.people.every((p: unknown) => typeof p === "string") ||
      !Array.isArray(parsed.assignments)
    ) {
      return null;
    }
    const assignments = parsed.assignments.filter(
      (a: unknown): a is SplitAssignment =>
        typeof a === "object" &&
        a !== null &&
        typeof (a as SplitAssignment).itemIndex === "number" &&
        Array.isArray((a as SplitAssignment).people) &&
        (a as SplitAssignment).people.every((p: unknown) => typeof p === "string")
    );
    if (parsed.people.length === 0) return null;
    return { people: parsed.people, assignments };
  } catch {
    return null;
  }
}

export function computeSplitTotals(items: ExpenseItem[], tax: number | undefined, split: SplitData | undefined) {
  const totals = new Map<string, number>();
  if (!split) return totals;
  for (const person of split.people) totals.set(person, 0);

  let assignedSubtotal = 0;
  for (const assignment of split.assignments) {
    const item = items[assignment.itemIndex];
    if (!item || assignment.people.length === 0) continue;
    const share = item.price / assignment.people.length;
    assignedSubtotal += item.price;
    for (const person of assignment.people) {
      totals.set(person, (totals.get(person) ?? 0) + share);
    }
  }

  if (tax && assignedSubtotal > 0) {
    for (const [person, subtotal] of totals) {
      totals.set(person, subtotal + tax * (subtotal / assignedSubtotal));
    }
  }

  return totals;
}

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
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  currency?: string;
  split?: SplitData;
  homeCurrencyAmount?: number;
  homeCurrencyCode?: string;
  items?: ExpenseItem[];
  createdAt: string;
};
