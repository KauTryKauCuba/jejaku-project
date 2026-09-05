import { describe, expect, it } from "vitest";
import { parseReceiptResponse, itemEntriesToObjects, resolveLinePrice } from "./receiptExtractParse";

describe("parseReceiptResponse", () => {
  it("parses a complete response with the primary {name, quantity, numbers} items shape", () => {
    const text =
      '{"merchant":"IKEA","amount":68.5,"items":[{"name":"Kettle","quantity":1,"numbers":[45.5]},' +
      '{"name":"Cable","quantity":2,"numbers":[4,8]}]}';
    const result = parseReceiptResponse(text, "stop");
    expect(result.truncated).toBe(false);
    expect(result.itemsRaw).toEqual([
      { name: "Kettle", quantity: 1, numbers: [45.5] },
      { name: "Cable", quantity: 2, numbers: [4, 8] },
    ]);
  });

  it("reports truncated when finish_reason is length, even on a complete parse", () => {
    const text = '{"merchant":"IKEA","amount":68.5,"items":[]}';
    const result = parseReceiptResponse(text, "length");
    expect(result.truncated).toBe(true);
    expect(result.fields?.merchant).toBe("IKEA");
  });

  it("returns null fields and no truncation for text with no JSON object at all", () => {
    const result = parseReceiptResponse("I cannot read this image.", "stop");
    expect(result.fields).toBeNull();
    expect(result.itemsRaw).toEqual([]);
    expect(result.truncated).toBe(false);
  });

  it("still flags truncated (via finish_reason) even when there's no JSON to salvage", () => {
    const result = parseReceiptResponse("", "length");
    expect(result.fields).toBeNull();
    expect(result.truncated).toBe(true);
  });

  it("salvages complete nested-array item entries when cut off mid-item", () => {
    // Realistic truncation: cut off partway through the last entry's own
    // nested `numbers` array — exactly what hitting max_tokens looks like
    // now that entries aren't flat.
    const text =
      '{"merchant":"Village Grocer","amount":79.4,"date":"2026-08-03","category":"Groceries",' +
      '"items":[{"name":"Fresh produce","quantity":1,"numbers":[34.5]},' +
      '{"name":"Dairy & eggs","quantity":1,"numbers":[22.9]},' +
      '{"name":"Snacks","quantity":1,"numbers":[1' /* cut off mid-number, inside the nested array */;
    const result = parseReceiptResponse(text, "length");
    expect(result.truncated).toBe(true);
    expect(result.fields).toMatchObject({ merchant: "Village Grocer", amount: 79.4, date: "2026-08-03", category: "Groceries" });
    expect(result.itemsRaw).toEqual([
      { name: "Fresh produce", quantity: 1, numbers: [34.5] },
      { name: "Dairy & eggs", quantity: 1, numbers: [22.9] },
    ]);
  });

  it("salvages scalar fields when items is cut off with zero complete entries", () => {
    const text = '{"merchant":"Costco","amount":210,"items":[{"name":"Bulk paper towels","quantity":1,"numbers":[4' /* cut off */;
    const result = parseReceiptResponse(text, "length");
    expect(result.truncated).toBe(true);
    expect(result.fields).toMatchObject({ merchant: "Costco", amount: 210 });
    expect(result.itemsRaw).toEqual([]);
  });

  it("gives up on the scalar prefix when the cut lands mid-string (a genuinely unrecoverable case)", () => {
    // Cutting off inside an unterminated string is unrecoverable — closing
    // with "}" just becomes more (invalid) string content, not real JSON
    // syntax. Contrast with cutting mid-number below, which recovers fine.
    const text = '{"merchant":"Cos' /* cut off inside the merchant string value */;
    const result = parseReceiptResponse(text, "length");
    expect(result.truncated).toBe(true);
    expect(result.fields).toBeNull();
  });

  it("recovers a scalar prefix cut off mid-number, before items starts at all", () => {
    // Numbers are self-terminating JSON tokens — cutting "210" down to
    // "21" and closing with "}" is still syntactically valid, just with a
    // wrong-but-parseable value. This is a real limitation (the salvaged
    // amount can be numerically wrong, not just absent) worth knowing
    // about, not just a happy-path case.
    const text = '{"merchant":"Costco","amount":21' /* cut off before "items" ever appears */;
    const result = parseReceiptResponse(text, "length");
    expect(result.truncated).toBe(true);
    expect(result.fields).toEqual({ merchant: "Costco", amount: 21 });
  });

  it("recovers a clean scalar prefix cut off exactly on a comma boundary", () => {
    const text = '{"merchant":"Costco","amount":210,' /* cut off right after the comma */;
    const result = parseReceiptResponse(text, "length");
    expect(result.fields).toEqual({ merchant: "Costco", amount: 210 });
  });

  it("drops one malformed entry within an otherwise-salvageable items list without losing the rest", () => {
    // {"bad": true,} is bracket-balanced (matched by the scanner) but
    // invalid JSON on its own (trailing comma) — should be skipped
    // without taking the surrounding, individually-valid entries down
    // with it. The response is also truncated at the very end,
    // guaranteeing the overall parse fails and the salvage path runs.
    const text =
      '{"merchant":"X","items":[{"name":"Good item","quantity":1,"numbers":[5]},{"bad": true,},' +
      '{"name":"Also good","quantity":1,"numbers":[7]},{"name":"Cut off","quantity":1,"numbers":[';
    const result = parseReceiptResponse(text, "length");
    expect(result.truncated).toBe(true);
    expect(result.itemsRaw).toEqual([
      { name: "Good item", quantity: 1, numbers: [5] },
      { name: "Also good", quantity: 1, numbers: [7] },
    ]);
  });

  it("tolerates a quoted item name containing brace/bracket characters without miscounting depth", () => {
    const text = '{"merchant":"X","items":[{"name":"Item [Sale] {Extra}","quantity":1,"numbers":[5]}]}';
    const result = parseReceiptResponse(text, "stop");
    expect(result.itemsRaw).toEqual([{ name: "Item [Sale] {Extra}", quantity: 1, numbers: [5] }]);
  });

  it("still salvages the older flat positional-array item shape (backward tolerance)", () => {
    const text = '{"merchant":"X","items":[["Good item",5],["Also good",7],["Cut off",';
    const result = parseReceiptResponse(text, "length");
    expect(result.truncated).toBe(true);
    expect(result.itemsRaw).toEqual([["Good item", 5], ["Also good", 7]]);
  });
});

describe("resolveLinePrice", () => {
  it("treats a single number as the line's total, dividing by quantity", () => {
    expect(resolveLinePrice(2, [23])).toEqual({ price: 11.5, reconciles: true });
    expect(resolveLinePrice(1, [23])).toEqual({ price: 23, reconciles: true });
  });

  it("treats two numbers as [per-unit price, line total] and trusts the price when they reconcile", () => {
    const result = resolveLinePrice(3, [4.2, 12.6]);
    expect(result.price).toBe(4.2);
    expect(result.reconciles).toBe(true);
  });

  it("flags priceUncertain-worthy mismatch when the two numbers don't reconcile", () => {
    // This is exactly the KK Super Mart failure case: the model reported
    // the line's AMOUNT as if it were the per-unit price.
    const result = resolveLinePrice(3, [12.6, 12.6]);
    expect(result.price).toBe(12.6);
    expect(result.reconciles).toBe(false); // 12.6 * 3 = 37.8, doesn't match the claimed total of 12.6
  });

  it("flags the Lotus's Express failure case: a column-bleed digit misread", () => {
    // Real line: quantity 2, price 11.50, total 23.00. Misread as 2.11.
    const result = resolveLinePrice(2, [2.11, 23.0]);
    expect(result.price).toBe(2.11);
    expect(result.reconciles).toBe(false); // 2.11 * 2 = 4.22, nowhere near 23.00
  });

  it("tolerates a cent or two of real-world rounding without flagging it", () => {
    const result = resolveLinePrice(3, [4.2, 12.61]); // 4.2 * 3 = 12.60, printed total 12.61
    expect(result.reconciles).toBe(true);
  });

  it("has nothing to cross-check with zero numbers, so it's unreconciled by definition", () => {
    expect(resolveLinePrice(1, [])).toEqual({ price: 0, reconciles: false });
  });

  it("uses only the first and last number when more than two are present", () => {
    const result = resolveLinePrice(2, [5, 999, 10]);
    expect(result.price).toBe(5);
    expect(result.reconciles).toBe(true); // 5 * 2 = 10, matches the last number
  });
});

describe("itemEntriesToObjects", () => {
  describe("{name, quantity, numbers} entries (the primary shape the prompt asks for)", () => {
    it("resolves a single-number entry as the line total divided by quantity", () => {
      expect(itemEntriesToObjects([{ name: "Bananas", quantity: 1, numbers: [2.5] }])).toEqual([
        { name: "Bananas", price: 2.5, quantity: undefined, priceUncertain: false },
      ]);
    });

    it("resolves a two-number entry using the first as price when it reconciles", () => {
      expect(itemEntriesToObjects([{ name: "Milk 1L", quantity: 2, numbers: [6.9, 13.8] }])).toEqual([
        { name: "Milk 1L", price: 6.9, quantity: 2, priceUncertain: false },
      ]);
    });

    it("marks priceUncertain when the two numbers don't reconcile, but still returns a best-guess price", () => {
      const result = itemEntriesToObjects([{ name: "Cheetos", quantity: 3, numbers: [12.6, 12.6] }]);
      expect(result).toEqual([{ name: "Cheetos", price: 12.6, quantity: 3, priceUncertain: true }]);
    });

    it("omits quantity in the output when it's the default of 1", () => {
      const result = itemEntriesToObjects([{ name: "Bananas", quantity: 1, numbers: [2.5] }]);
      expect(result[0].quantity).toBeUndefined();
    });

    it("treats a missing or invalid quantity as 1", () => {
      expect(itemEntriesToObjects([{ name: "Bananas", numbers: [2.5] }])[0].quantity).toBeUndefined();
      expect(itemEntriesToObjects([{ name: "Bananas", quantity: -1, numbers: [2.5] }])[0].quantity).toBeUndefined();
      expect(itemEntriesToObjects([{ name: "Bananas", quantity: "two", numbers: [2.5] }])[0].quantity).toBeUndefined();
    });

    it("drops an entry with a missing or non-string name", () => {
      expect(itemEntriesToObjects([{ quantity: 1, numbers: [2.5] }])).toEqual([]);
      expect(itemEntriesToObjects([{ name: null, quantity: 1, numbers: [2.5] }])).toEqual([]);
    });

    it("drops an entry whose numbers array is empty or has no valid numbers", () => {
      expect(itemEntriesToObjects([{ name: "Bananas", quantity: 1, numbers: [] }])).toEqual([]);
      expect(itemEntriesToObjects([{ name: "Bananas", quantity: 1, numbers: ["2.50"] }])).toEqual([]);
    });

    it("filters out non-numeric entries within a numbers array but keeps the valid ones", () => {
      const result = itemEntriesToObjects([{ name: "Bananas", quantity: 1, numbers: [2.5, "oops", NaN] }]);
      expect(result).toEqual([{ name: "Bananas", price: 2.5, quantity: undefined, priceUncertain: false }]);
    });
  });

  describe("older tolerated shapes (backward compatibility if the model reverts on a given call)", () => {
    it("accepts a direct {name, price, quantity?} object", () => {
      expect(itemEntriesToObjects([{ name: "Bananas", price: 2.5 }])).toEqual([
        { name: "Bananas", price: 2.5, quantity: undefined, priceUncertain: false },
      ]);
      expect(itemEntriesToObjects([{ name: "Milk", price: 6.9, quantity: 2 }])).toEqual([
        { name: "Milk", price: 6.9, quantity: 2, priceUncertain: false },
      ]);
    });

    it("accepts a [name, price, quantity?] positional array", () => {
      expect(itemEntriesToObjects([["Bananas", 2.5]])).toEqual([
        { name: "Bananas", price: 2.5, quantity: undefined, priceUncertain: false },
      ]);
      expect(itemEntriesToObjects([["Milk", 6.9, 2]])).toEqual([{ name: "Milk", price: 6.9, quantity: 2, priceUncertain: false }]);
    });
  });

  it("drops an entry that's neither an object nor an array", () => {
    expect(itemEntriesToObjects(["not an item", 42, null, undefined])).toEqual([]);
  });

  it("keeps valid entries and drops invalid ones from a mixed list of every shape", () => {
    const result = itemEntriesToObjects([
      { name: "Good, numbers shape", quantity: 1, numbers: [5] },
      { name: "Good, price shape", price: 7 },
      ["Good, array shape", 9],
      { name: "Bad, empty numbers", numbers: [] },
      "not an item at all",
    ]);
    expect(result.map((r) => r.name)).toEqual(["Good, numbers shape", "Good, price shape", "Good, array shape"]);
  });

  it("returns an empty array for empty input", () => {
    expect(itemEntriesToObjects([])).toEqual([]);
  });
});
