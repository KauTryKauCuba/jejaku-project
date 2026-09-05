import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, type Expense } from "./expenses";

const PDF_COLUMNS = ["Date", "Merchant", "Category", "Amount", "Tax", "Location"] as const;

function locationOf(e: Expense): string {
  return [e.city, e.state, e.country].filter(Boolean).join(", ");
}

export function downloadPdf(filename: string, expenses: Expense[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt" });

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
      locationOf(e),
    ]),
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [15, 118, 110] },
    margin: { left: 40, right: 40 },
  });

  doc.save(filename);
}
