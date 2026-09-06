import { describe, expect, it } from "vitest";
import { expensesToCsv } from "./exportCsv";
import { formatCurrency, type Expense } from "./expenses";

function baseExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "1",
    merchant: "Test Store",
    amount: 10,
    date: "2026-01-15",
    category: "Groceries",
    createdAt: "2026-01-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("expensesToCsv", () => {
  it("includes the warranty coverage and expiry columns in the header", () => {
    const csv = expensesToCsv([]);
    const header = csv.replace(/^﻿/, "").split("\r\n")[0];
    expect(header).toContain("Warranty coverage (months)");
    expect(header).toContain("Warranty expiry");
  });

  it("fills coverage and a derived expiry date for a tracked warranty claim", () => {
    const csv = expensesToCsv([baseExpense({ isWarrantyClaim: true, warrantyMonths: 12 })]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain(",Yes,12,2027-01-15,");
  });

  it("leaves both blank for a claim tagged with no coverage length picked", () => {
    const csv = expensesToCsv([baseExpense({ isWarrantyClaim: true })]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain(",Yes,,,");
  });

  it("leaves both blank for a non-warranty expense, even if warrantyMonths is somehow set", () => {
    const csv = expensesToCsv([baseExpense({ isWarrantyClaim: false, warrantyMonths: 6 })]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain(",,,,");
  });

  it("ignores the receipt-level flag and reads item-level tags instead, once any item is tagged", () => {
    const csv = expensesToCsv([
      baseExpense({
        isWarrantyClaim: true,
        warrantyMonths: 24, // stale whole-receipt tag from before item-level tagging existed
        items: [{ name: "Kettle", price: 20, isWarrantyClaim: true, warrantyMonths: 12 }],
      }),
    ]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain(",Yes,12,2027-01-15,");
  });

  it("lists each tagged item by name in the coverage/expiry cells when more than one is tagged", () => {
    const csv = expensesToCsv([
      baseExpense({
        items: [
          { name: "Kettle", price: 20, isWarrantyClaim: true, warrantyMonths: 12 },
          { name: "Phone case", price: 5 }, // untagged, excluded
          { name: "USB cable", price: 8, isWarrantyClaim: true }, // tagged, no length picked
        ],
      }),
    ]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain("Kettle: 12; USB cable: —");
    expect(row).toContain("Kettle: 2027-01-15; USB cable: —");
  });

  it("includes the Items column in the header", () => {
    const csv = expensesToCsv([]);
    const header = csv.replace(/^﻿/, "").split("\r\n")[0];
    expect(header.split(",")).toContain("Items");
  });

  it("quotes a multi-item cell per RFC 4180, since the list is joined with newlines", () => {
    const csv = expensesToCsv([
      baseExpense({
        items: [
          { name: "Bananas", price: 2.5 },
          { name: "Almond milk", price: 4 },
        ],
      }),
    ]);
    // Splitting on "\r\n" (the row separator) still isolates this row
    // cleanly even though its Items cell contains a bare "\n" internally —
    // rows are joined with the two-character sequence, items only with one.
    const row = csv.split("\r\n")[1];
    expect(row).toContain(`"Bananas — ${formatCurrency(2.5)}\nAlmond milk — ${formatCurrency(4)}"`);
  });

  it("leaves the Items cell empty for a receipt with no items", () => {
    const csv = expensesToCsv([baseExpense()]);
    const row = csv.split("\r\n")[1];
    expect(row.endsWith(",")).toBe(true);
  });

  it("neutralizes a merchant/note starting with =, +, -, or @ so it can't open as a formula in Excel/Sheets", () => {
    for (const trigger of ["=", "+", "-", "@"]) {
      const csv = expensesToCsv([baseExpense({ merchant: `${trigger}cmd|'/C calc'!A1`, note: `${trigger}SUM(A1:A9)` })]);
      const row = csv.split("\r\n")[1];
      expect(row).toContain(`'${trigger}cmd`);
      expect(row).toContain(`'${trigger}SUM`);
    }
  });

  it("doesn't touch a merchant/note that merely contains one of those characters mid-string", () => {
    const csv = expensesToCsv([baseExpense({ merchant: "Buy-More", note: "Tax = included" })]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain("Buy-More");
    expect(row).toContain("Tax = included");
  });
});
