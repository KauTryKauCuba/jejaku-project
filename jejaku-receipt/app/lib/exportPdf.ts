import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatItemsList, type Expense } from "./expenses";
import { formatIsoDate } from "./formatIso";
import { warrantyExportFields } from "./warranty";

// Same fields as the CSV export (see CSV_COLUMNS there) — Currency and
// City/State/Country stay separate, structured columns in CSV for
// spreadsheet filtering; here they're folded into Amount/Tax and Location
// instead, since a printed report reads better as prose than as more
// narrow columns. Warranty likewise collapses CSV's three columns (claim/
// coverage/expiry) into one cell — content is the same, only the shape
// changes per format.
const PDF_COLUMNS = ["Date", "Merchant", "Category", "Amount", "Tax", "Warranty", "Location", "Note", "Items"] as const;

function locationOf(e: Expense): string {
  return [e.city, e.state, e.country].filter(Boolean).join(", ");
}

function warrantyOf(e: Expense): string {
  const { isClaim, months, expiry } = warrantyExportFields(e);
  if (!isClaim) return "";
  if (months === undefined || !expiry) return "Yes";
  return `Yes — ${months}mo, expires ${formatIsoDate(expiry)}`;
}

export function downloadPdf(filename: string, expenses: Expense[]) {
  // Landscape, not portrait — nine columns (up from the original six)
  // once Warranty and Note joined Items in bringing this in line with the
  // CSV export's field set. Portrait was already tight before that.
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

  doc.setFontSize(14);
  doc.text("Jejaku Receipt — Expense Report", 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · ${expenses.length} receipt${expenses.length === 1 ? "" : "s"}`, 40, 56);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  // Only meaningful when every row shares one currency — mixed-currency
  // exports show per-row amounts but skip a misleading combined total.
  const currencies = new Set(expenses.map((e) => e.currency ?? "USD"));
  const totalLabel = currencies.size === 1 ? `Total: ${formatCurrency(total, [...currencies][0])}` : undefined;
  if (totalLabel) {
    doc.text(totalLabel, 40, 70);
  }

  autoTable(doc, {
    startY: totalLabel ? 84 : 70,
    head: [[...PDF_COLUMNS]],
    body: expenses.map((e) => [
      e.date,
      e.merchant,
      e.category,
      formatCurrency(e.amount, e.currency),
      e.tax ? formatCurrency(e.tax, e.currency) : "",
      warrantyOf(e),
      locationOf(e),
      e.note ?? "",
      formatItemsList(e),
    ]),
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [15, 118, 110] },
    // Amount and Tax (3, 4) are left unset on purpose, not given a fixed
    // width like the rest — a formatted amount's digit count swings a lot
    // more than the other columns' (USD 4.50 vs MYR 12,345.67), and a
    // fixed width narrow enough for the common case wrapped mid-number on
    // a large one (confirmed while testing this). 'auto' sizes each to
    // its own content instead. Items is also left unset so it gets
    // whatever's left over — the right default since it's the one column
    // that can run to several stacked lines and most needs the room.
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 85 },
      2: { cellWidth: 65 },
      5: { cellWidth: 110 },
      6: { cellWidth: 90 },
      7: { cellWidth: 90 },
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(filename);
}
