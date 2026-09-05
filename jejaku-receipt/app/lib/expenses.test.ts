import { describe, expect, it } from "vitest";
import {
  computeSplitTotals,
  formatCurrency,
  formatItemsList,
  lineTotal,
  normalizeItems,
  type ExpenseItem,
  type SplitData,
} from "./expenses";

describe("lineTotal", () => {
  it("multiplies price by quantity", () => {
    expect(lineTotal({ name: "Coffee", price: 4.5, quantity: 3 })).toBe(13.5);
  });

  it("defaults quantity to 1 when absent", () => {
    expect(lineTotal({ name: "Coffee", price: 4.5 })).toBe(4.5);
  });

  it("rounds to the nearest cent to avoid float drift", () => {
    // 0.1 + 0.2 territory: 3 x 0.1 in floating point is 0.30000000000000004.
    expect(lineTotal({ name: "Item", price: 0.1, quantity: 3 })).toBe(0.3);
  });
});

describe("computeSplitTotals", () => {
  const items: ExpenseItem[] = [
    { name: "Pizza", price: 20, quantity: 1 },
    { name: "Salad", price: 10, quantity: 1 },
  ];

  it("returns an empty map when there's no split", () => {
    expect(computeSplitTotals(items, undefined, undefined).size).toBe(0);
  });

  it("splits an item's cost evenly among its assigned people", () => {
    const split: SplitData = {
      people: ["Alice", "Bob"],
      assignments: [{ itemIndex: 0, people: ["Alice", "Bob"] }],
    };
    const totals = computeSplitTotals(items, undefined, split);
    expect(totals.get("Alice")).toBe(10);
    expect(totals.get("Bob")).toBe(10);
  });

  it("gives every listed person an entry even with nothing assigned to them", () => {
    const split: SplitData = {
      people: ["Alice", "Bob"],
      assignments: [{ itemIndex: 0, people: ["Alice"] }],
    };
    const totals = computeSplitTotals(items, undefined, split);
    expect(totals.get("Alice")).toBe(20);
    expect(totals.get("Bob")).toBe(0);
  });

  it("distributes tax proportionally to each person's assigned subtotal", () => {
    // Alice: item 0 (20), Bob: item 1 (10) — 2:1 subtotal ratio, so a 9
    // tax should split 6/3 in that same ratio.
    const split: SplitData = {
      people: ["Alice", "Bob"],
      assignments: [
        { itemIndex: 0, people: ["Alice"] },
        { itemIndex: 1, people: ["Bob"] },
      ],
    };
    const totals = computeSplitTotals(items, 9, split);
    expect(totals.get("Alice")).toBe(26);
    expect(totals.get("Bob")).toBe(13);
  });

  it("ignores an assignment pointing at a missing item index", () => {
    const split: SplitData = {
      people: ["Alice"],
      assignments: [{ itemIndex: 5, people: ["Alice"] }],
    };
    const totals = computeSplitTotals(items, undefined, split);
    expect(totals.get("Alice")).toBe(0);
  });

  it("ignores an assignment with nobody assigned", () => {
    const split: SplitData = {
      people: ["Alice"],
      assignments: [{ itemIndex: 0, people: [] }],
    };
    const totals = computeSplitTotals(items, undefined, split);
    expect(totals.get("Alice")).toBe(0);
  });

  it("skips tax distribution entirely if nothing was assigned", () => {
    const split: SplitData = { people: ["Alice"], assignments: [] };
    const totals = computeSplitTotals(items, 9, split);
    expect(totals.get("Alice")).toBe(0);
  });

  it("doesn't dump an unassigned item's tax share onto whoever IS assigned", () => {
    // Pizza (20) goes to Alice, Salad (10) is left unassigned — maybe it
    // was a shared side nobody tagged. A regression test for a bug where
    // tax was divided by the *assigned* subtotal (20) instead of the full
    // receipt subtotal (30), so Alice absorbed 100% of the tax instead of
    // her fair 2/3 share.
    const split: SplitData = {
      people: ["Alice"],
      assignments: [{ itemIndex: 0, people: ["Alice"] }],
    };
    const totals = computeSplitTotals(items, 9, split);
    // 20 + 9 * (20/30) = 26, not 20 + 9 = 29.
    expect(totals.get("Alice")).toBe(26);
  });
});

describe("formatItemsList", () => {
  it("returns an empty string when there are no items", () => {
    expect(formatItemsList({ items: undefined, currency: "USD" })).toBe("");
    expect(formatItemsList({ items: [], currency: "USD" })).toBe("");
  });

  it("hides quantity when it's the implicit default of 1", () => {
    const expected = `Coffee — ${formatCurrency(4.5, "USD")}`;
    expect(formatItemsList({ items: [{ name: "Coffee", price: 4.5 }], currency: "USD" })).toBe(expected);
    expect(
      formatItemsList({ items: [{ name: "Coffee", price: 4.5, quantity: 1 }], currency: "USD" })
    ).toBe(expected);
  });

  it("shows quantity when it's more than 1, using the item's line total", () => {
    expect(
      formatItemsList({ items: [{ name: "Iced tea", price: 4.5, quantity: 2 }], currency: "USD" })
    ).toBe(`Iced tea ×2 — ${formatCurrency(9, "USD")}`);
  });

  it("joins multiple items with a newline, one per line", () => {
    const result = formatItemsList({
      items: [
        { name: "Bananas", price: 2.5 },
        { name: "Almond milk", price: 4 },
      ],
      currency: "USD",
    });
    expect(result).toBe(`Bananas — ${formatCurrency(2.5, "USD")}\nAlmond milk — ${formatCurrency(4, "USD")}`);
  });
});

describe("normalizeItems", () => {
  it("drops entries that aren't shaped like an item", () => {
    const result = normalizeItems([{ name: "Valid", price: 5 }, { name: "No price" }, "not an object", null]);
    expect(result).toEqual([{ name: "Valid", price: 5, quantity: undefined }]);
  });

  it("drops a nonsensical quantity rather than rejecting the item", () => {
    const result = normalizeItems([{ name: "Item", price: 5, quantity: -1 }]);
    expect(result[0].quantity).toBeUndefined();
  });

  it("returns an empty array for non-array input", () => {
    expect(normalizeItems(null)).toEqual([]);
    expect(normalizeItems(undefined)).toEqual([]);
    expect(normalizeItems("nope")).toEqual([]);
  });
});
