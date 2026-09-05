import { describe, expect, it } from "vitest";
import { computeItemsMismatch } from "./receiptSanity";
import type { ExpenseItem } from "./expenses";

const items: ExpenseItem[] = [
  { name: "Burger", price: 8, quantity: 1 },
  { name: "Fries", price: 4, quantity: 1 },
];

describe("computeItemsMismatch", () => {
  it("is false with no items — nothing to reconcile against", () => {
    expect(computeItemsMismatch([], null, 100)).toBe(false);
  });

  it("is false when amount is null — nothing to reconcile against", () => {
    expect(computeItemsMismatch(items, 1, null)).toBe(false);
  });

  it("is false when items + tax reconcile with the total", () => {
    expect(computeItemsMismatch(items, 1, 13)).toBe(false);
  });

  it("tolerates a small discount/rounding gap", () => {
    // items total 12, amount 12.50 — a 0.50 gap is well under the 8%/$1 floor.
    expect(computeItemsMismatch(items, null, 12.5)).toBe(false);
  });

  it("flags a gross misread, like a doubled unit price", () => {
    // items total 12 vs. an amount of 24 — the classic 2x pricing bug.
    expect(computeItemsMismatch(items, null, 24)).toBe(true);
  });

  it("uses a $1 floor rather than the percentage for small totals", () => {
    // 8% of 5 is $0.40 — the $1 floor should still catch a $1.50 gap.
    const smallItems: ExpenseItem[] = [{ name: "Gum", price: 5, quantity: 1 }];
    expect(computeItemsMismatch(smallItems, null, 6.5)).toBe(true);
  });
});
