import { lineTotal, type ExpenseItem } from "./expenses";

// True when the extracted items + tax don't reasonably add up to the
// extracted amount — a red flag that something was misread (e.g. the
// per-unit-price/quantity bug this was added to catch), surfaced to the
// user instead of silently pre-filling numbers that don't reconcile.
//
// Generous on purpose: legitimate receipts often have a discount, service
// charge, or rounding line that isn't captured in items/tax, so this only
// needs to catch gross misreads (like a 2x pricing error), not nitpick
// every few cents.
export function computeItemsMismatch(items: ExpenseItem[], tax: number | null, amount: number | null): boolean {
  if (items.length === 0 || amount === null) return false;
  const itemsTotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const expected = itemsTotal + (tax ?? 0);
  return Math.abs(expected - amount) > Math.max(1, amount * 0.08);
}
