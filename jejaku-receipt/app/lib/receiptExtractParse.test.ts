import { describe, expect, it } from "vitest";
import { parseReceiptResponse, positionalItemsToObjects } from "./receiptExtractParse";

describe("parseReceiptResponse", () => {
  it("parses a complete, well-formed response", () => {
    const text = '{"merchant":"IKEA","amount":68.5,"date":"2026-01-15","items":[["Kettle",45.5,1],["Cable",8]]}';
    const result = parseReceiptResponse(text, "stop");
    expect(result.truncated).toBe(false);
    expect(result.fields).toEqual({
      merchant: "IKEA",
      amount: 68.5,
      date: "2026-01-15",
      items: [["Kettle", 45.5, 1], ["Cable", 8]],
    });
    expect(result.itemsRaw).toEqual([["Kettle", 45.5, 1], ["Cable", 8]]);
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

  it("salvages scalar fields and complete items when the response is cut off mid-item", () => {
    // Realistic truncation: a long items array cut off partway through the
    // last entry, exactly what hitting max_tokens looks like.
    const text =
      '{"merchant":"Village Grocer","amount":79.4,"date":"2026-08-03","category":"Groceries",' +
      '"items":[["Fresh produce",34.5],["Dairy & eggs",22.9],["Snacks",1' /* cut off mid-number */;
    const result = parseReceiptResponse(text, "length");
    expect(result.truncated).toBe(true);
    expect(result.fields).toMatchObject({ merchant: "Village Grocer", amount: 79.4, date: "2026-08-03", category: "Groceries" });
    // The incomplete third entry is dropped, the two complete ones survive.
    expect(result.itemsRaw).toEqual([["Fresh produce", 34.5], ["Dairy & eggs", 22.9]]);
  });

  it("salvages scalar fields when items is cut off with zero complete entries", () => {
    const text = '{"merchant":"Costco","amount":210,"items":[["Bulk paper towels",4' /* cut off */;
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
    // [1,2,3,] is bracket-shaped (matched by the entry regex) but invalid
    // JSON on its own (trailing comma) — should be skipped without taking
    // the surrounding, individually-valid entries down with it. The
    // response is also truncated at the very end, guaranteeing the
    // overall parse fails and the salvage path actually runs.
    const text = '{"merchant":"X","items":[["Good item",5],[1,2,3,],["Also good",7],["Cut off",';
    const result = parseReceiptResponse(text, "length");
    expect(result.truncated).toBe(true);
    expect(result.itemsRaw).toEqual([["Good item", 5], ["Also good", 7]]);
  });
});

describe("positionalItemsToObjects", () => {
  it("converts [name, price] tuples", () => {
    expect(positionalItemsToObjects([["Bananas", 2.5]])).toEqual([{ name: "Bananas", price: 2.5 }]);
  });

  it("converts [name, price, quantity] tuples", () => {
    expect(positionalItemsToObjects([["Milk 1L", 6.9, 2]])).toEqual([{ name: "Milk 1L", price: 6.9, quantity: 2 }]);
  });

  it("omits quantity when it's the default of 1", () => {
    const result = positionalItemsToObjects([["Bananas", 2.5, 1]]);
    expect(result[0]).not.toHaveProperty("quantity");
  });

  it("drops an entry with a non-finite or nonsensical quantity, keeping name/price", () => {
    expect(positionalItemsToObjects([["Bananas", 2.5, -1]])).toEqual([{ name: "Bananas", price: 2.5 }]);
    expect(positionalItemsToObjects([["Bananas", 2.5, NaN]])).toEqual([{ name: "Bananas", price: 2.5 }]);
  });

  it("drops an entry with a missing or non-string name", () => {
    expect(positionalItemsToObjects([[5, 2.5]])).toEqual([]);
    expect(positionalItemsToObjects([[null, 2.5]])).toEqual([]);
  });

  it("drops an entry with a missing or non-numeric price", () => {
    expect(positionalItemsToObjects([["Bananas"]])).toEqual([]);
    expect(positionalItemsToObjects([["Bananas", "2.50"]])).toEqual([]);
    expect(positionalItemsToObjects([["Bananas", NaN]])).toEqual([]);
  });

  it("drops an entry that isn't an array at all", () => {
    expect(positionalItemsToObjects([{ name: "Bananas", price: 2.5 }, "not an item"])).toEqual([]);
  });

  it("keeps valid entries and drops invalid ones from the same list", () => {
    const result = positionalItemsToObjects([
      ["Good", 5],
      ["Bad", "not a number"],
      ["Also good", 7, 2],
    ]);
    expect(result).toEqual([{ name: "Good", price: 5 }, { name: "Also good", price: 7, quantity: 2 }]);
  });

  it("returns an empty array for empty input", () => {
    expect(positionalItemsToObjects([])).toEqual([]);
  });
});
