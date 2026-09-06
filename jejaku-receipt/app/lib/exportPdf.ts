import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatItemsList, type Expense } from "./expenses";
import { formatIsoDate } from "./formatIso";
import { warrantyClaimsFor } from "./warranty";

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
  const claims = warrantyClaimsFor(e);
  if (claims.length === 0) return "";
  // Single-claim text is unchanged from before item-level tags existed
  // ("Yes" / "Yes — 12mo, expires ..."); multiple tagged items instead
  // list each by name, since "Yes" alone wouldn't say which of them.
  if (claims.length === 1) {
    const [c] = claims;
    if (c.months === undefined || !c.expiry) return "Yes";
    return `Yes — ${c.months}mo, expires ${formatIsoDate(c.expiry)}`;
  }
  return claims
    .map((c) => (c.months !== undefined && c.expiry ? `${c.label}: ${c.months}mo, expires ${formatIsoDate(c.expiry)}` : `${c.label}: —`))
    .join("; ");
}

// Static asset, not user content — fetched fresh each export rather than
// bundled as a data URL constant so the source PNG (rasterized from
// public/jk-logo.svg via sharp; jsPDF's addImage doesn't take SVG) can be
// swapped without touching this file. Failure just means no logo, not a
// broken export — the report is still useful without it.
function loadLogoDataUrl(): Promise<string | null> {
  return fetch("/jk-logo.png")
    .then((res) => (res.ok ? res.blob() : null))
    .then(
      (blob) =>
        blob &&
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        })
    )
    .catch(() => null);
}

export async function downloadPdf(filename: string, expenses: Expense[]) {
  // Portrait — nine columns (up from the original six, once Warranty and
  // Note joined Items to match the CSV export's field set) means every
  // column below is narrower and the font smaller than a portrait table
  // would otherwise use, trading a bit of density for the page shape a
  // printed report is expected to have.
  const doc = new jsPDF({ orientation: "portrait", unit: "pt" });
  const logo = await loadLogoDataUrl();

  const textX = logo ? 84 : 40;
  if (logo) {
    doc.addImage(logo, "PNG", 40, 24, 32, 32);
  }
  doc.setFontSize(14);
  doc.text("Jejaku Receipt — Expense Report", textX, 40);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · ${expenses.length} receipt${expenses.length === 1 ? "" : "s"}`, textX, 54);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  // Only meaningful when every row shares one currency — mixed-currency
  // exports show per-row amounts but skip a misleading combined total.
  const currencies = new Set(expenses.map((e) => e.currency ?? "USD"));
  const totalLabel = currencies.size === 1 ? `Total: ${formatCurrency(total, [...currencies][0])}` : undefined;
  if (totalLabel) {
    doc.text(totalLabel, 40, 74);
  }

  autoTable(doc, {
    startY: totalLabel ? 90 : 76,
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
    styles: { fontSize: 7, cellPadding: 4 },
    headStyles: { fillColor: [15, 118, 110] },
    // Amount and Tax (3, 4) are left unset on purpose, not given a fixed
    // width like the rest — a formatted amount's digit count swings a lot
    // more than the other columns' (USD 4.50 vs MYR 12,345.67), and a
    // fixed width narrow enough for the common case wrapped mid-number on
    // a large one (confirmed while testing this). 'auto' sizes each to
    // its own content instead. Items is also left unset so it gets
    // whatever's left over — the right default since it's the one column
    // that can run to several stacked lines and most needs the room.
    // Narrower than the old landscape widths across the board — portrait's
    // ~515pt usable width (vs. landscape's ~762pt) has to fit the same nine
    // columns, so more rows will wrap to multiple lines than before; that's
    // expected, not a bug.
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 68 },
      2: { cellWidth: 48 },
      5: { cellWidth: 65 },
      6: { cellWidth: 55 },
      7: { cellWidth: 50 },
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(filename);
}
