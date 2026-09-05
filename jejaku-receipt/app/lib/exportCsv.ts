import { formatItemsList, type Expense } from "./expenses";
import { formatIsoDate } from "./formatIso";
import { warrantyClaimsFor } from "./warranty";

const CSV_COLUMNS = [
  "Date",
  "Merchant",
  "Category",
  "Amount",
  "Currency",
  "Tax",
  "Warranty claim",
  "Warranty coverage (months)",
  "Warranty expiry",
  "City",
  "State",
  "Country",
  "Note",
  "Items",
] as const;

// Quotes any field containing a comma, quote, or newline, per RFC 4180 —
// escaping is required even for currency-formatted numbers here since
// merchant/note/location are free text that can contain commas.
function csvField(value: string | number | undefined): string {
  const text = value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

// The coverage/expiry cells stay single scalar values (unchanged from
// before item-level tags existed) when there's zero or one claim on the
// receipt — the overwhelming common case — so existing spreadsheets built
// against this column shape keep working. Only when a receipt has more
// than one tagged item does either cell become a "label: value" list, one
// per claim, joined the same way formatItemsList joins multiple items.
function warrantyCells(expense: Expense): { claim: string; months: string; expiry: string } {
  const claims = warrantyClaimsFor(expense);
  if (claims.length === 0) return { claim: "", months: "", expiry: "" };
  if (claims.length === 1) {
    const [c] = claims;
    return { claim: "Yes", months: c.months !== undefined ? String(c.months) : "", expiry: c.expiry ? formatIsoDate(c.expiry) : "" };
  }
  return {
    claim: "Yes",
    months: claims.map((c) => `${c.label}: ${c.months ?? "—"}`).join("; "),
    expiry: claims.map((c) => `${c.label}: ${c.expiry ? formatIsoDate(c.expiry) : "—"}`).join("; "),
  };
}

export function expensesToCsv(expenses: Expense[]): string {
  const rows = expenses.map((e) => {
    const warranty = warrantyCells(e);
    return [
      e.date,
      e.merchant,
      e.category,
      e.amount,
      e.currency ?? "",
      e.tax ?? "",
      warranty.claim,
      warranty.months,
      warranty.expiry,
      e.city ?? "",
      e.state ?? "",
      e.country ?? "",
      e.note ?? "",
      formatItemsList(e),
    ]
      .map(csvField)
      .join(",");
  });
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
