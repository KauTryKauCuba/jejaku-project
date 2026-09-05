import type { Expense } from "./expenses";

const CSV_COLUMNS = [
  "Date",
  "Merchant",
  "Category",
  "Amount",
  "Currency",
  "Tax",
  "Warranty claim",
  "City",
  "State",
  "Country",
  "Note",
] as const;

// Quotes any field containing a comma, quote, or newline, per RFC 4180 —
// escaping is required even for currency-formatted numbers here since
// merchant/note/location are free text that can contain commas.
function csvField(value: string | number | undefined): string {
  const text = value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function expensesToCsv(expenses: Expense[]): string {
  const rows = expenses.map((e) =>
    [
      e.date,
      e.merchant,
      e.category,
      e.amount,
      e.currency ?? "",
      e.tax ?? "",
      e.isWarrantyClaim ? "Yes" : "",
      e.city ?? "",
      e.state ?? "",
      e.country ?? "",
      e.note ?? "",
    ]
      .map(csvField)
      .join(",")
  );
  // Leading BOM so Excel (which sniffs encoding rather than assuming UTF-8)
  // renders non-ASCII merchant/note text correctly instead of mangling it.
  return "﻿" + [CSV_COLUMNS.join(","), ...rows].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
