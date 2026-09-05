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
  // Stable across edits (assigned once, on creation) so a warranty tag
  // stays pinned to the right line even if other items are later added,
  // removed, or reordered — unlike SplitData's assignments below, which
  // key by array index and can drift if the list changes shape after the
  // fact. Optional only because items saved before this field existed have
  // none; normalizeItems backfills one the moment the expense is next
  // saved, and every item passing through ExpenseForm gets one on mount
  // (see its `items` state init), so in practice anything the user can
  // actually interact with already has one.
  id?: string;
  name: string;
  /** Unit price — the line's total is price × quantity, not price alone. */
  price: number;
  /** Defaults to 1 when absent (older saved items never had this field). */
  quantity?: number;
  // Per-item warranty tag — lets one itemized receipt carry a kettle with
  // a year of coverage and a phone case with none, which a single
  // receipt-level `isWarrantyClaim` (see the `expenses` table) can't
  // express. See warrantyClaimsFor in lib/warranty.ts for how item-level
  // tags and the receipt-level flag combine into one list.
  isWarrantyClaim?: boolean;
  warrantyMonths?: number;
};

// Web Crypto's randomUUID, not Node's `crypto` module import — this file
// is bundled into client components (ExpenseForm) as well as server
// routes, and Node's built-in module isn't available in the browser
// bundle. `crypto.randomUUID` is global in both: Node 20 (this app's
// runtime) and any browser over HTTPS or localhost.
export function generateItemId(): string {
  return crypto.randomUUID();
}

/** A blank item row for the "Add item" button — always gets its own id. */
export function newItem(): ExpenseItem {
  return { id: generateItemId(), name: "", price: 0, quantity: 1 };
}

export function lineTotal(item: ExpenseItem): number {
  return Math.round(item.price * (item.quantity ?? 1) * 100) / 100;
}

// One line per item, quantity shown only when it's not the implicit
// default of 1 (matches how the receipt form itself hides quantity for a
// plain single item) — used by both exports (CSV and PDF) so a receipt's
// line items read the same way in either one. Joined with "\n" rather
// than a delimiter like "; " since both destinations render it as a
// stacked list: autoTable turns "\n" into a real line break within a
// cell, and csvField already quotes a field containing a newline per RFC
// 4180, so it opens as a multi-line cell in Excel/Sheets too.
export function formatItemsList(e: Pick<Expense, "items" | "currency">): string {
  if (!e.items || e.items.length === 0) return "";
  return e.items
    .map((item) => {
      const qty = item.quantity && item.quantity !== 1 ? ` ×${item.quantity}` : "";
      return `${item.name}${qty} — ${formatCurrency(lineTotal(item), e.currency)}`;
    })
    .join("\n");
}

// Validates and normalizes an already-JSON-parsed items array (e.g. the
// AI-extracted `items` field, which never has `id`/warranty fields at all,
// or a client-submitted edit) — filters out anything not shaped like an
// item, drops a nonsensical quantity (non-finite or <= 0) rather than
// rejecting the whole item over it, and backfills a missing id rather than
// rejecting the item or leaving it unaddressable for warranty tagging.
export function normalizeItems(raw: unknown): ExpenseItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is ExpenseItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as ExpenseItem).name === "string" &&
        typeof (item as ExpenseItem).price === "number" &&
        Number.isFinite((item as ExpenseItem).price)
    )
    .map((item) => {
      const isWarrantyClaim = item.isWarrantyClaim === true;
      return {
        id: typeof item.id === "string" && item.id ? item.id : generateItemId(),
        name: item.name,
        price: item.price,
        quantity:
          typeof item.quantity === "number" && Number.isFinite(item.quantity) && item.quantity > 0
            ? item.quantity
            : undefined,
        isWarrantyClaim: isWarrantyClaim || undefined,
        // Same rule as the receipt-level field this mirrors (see the API
        // routes' validation): only meaningful, and only kept, alongside
        // an actual claim tag.
        warrantyMonths:
          isWarrantyClaim &&
          typeof item.warrantyMonths === "number" &&
          Number.isInteger(item.warrantyMonths) &&
          item.warrantyMonths > 0
            ? item.warrantyMonths
            : undefined,
      };
    });
}

// Parses the `items` FormData field posted by ExpenseForm. Malformed input
// degrades to no items rather than rejecting the whole expense submission
// over a non-essential field — same as `split` beside it.
export function parseItems(raw: FormDataEntryValue | null): ExpenseItem[] | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    return normalizeItems(JSON.parse(raw));
  } catch {
    return null;
  }
}

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

  for (const assignment of split.assignments) {
    const item = items[assignment.itemIndex];
    if (!item || assignment.people.length === 0) continue;
    const total = lineTotal(item);
    const share = total / assignment.people.length;
    for (const person of assignment.people) {
      totals.set(person, (totals.get(person) ?? 0) + share);
    }
  }

  // Tax is distributed relative to the whole receipt's item subtotal, not
  // just the assigned portion — dividing by the assigned-only subtotal
  // would dump an unassigned item's share of tax entirely onto whoever IS
  // in the split, overcharging them for something nobody claimed.
  const itemsSubtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  if (tax && itemsSubtotal > 0) {
    for (const [person, subtotal] of totals) {
      totals.set(person, subtotal + tax * (subtotal / itemsSubtotal));
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
  warrantyMonths?: number;
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
