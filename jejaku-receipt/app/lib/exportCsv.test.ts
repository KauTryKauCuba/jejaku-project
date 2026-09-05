import { describe, expect, it } from "vitest";
import { expensesToCsv } from "./exportCsv";
import type { Expense } from "./expenses";

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
});
