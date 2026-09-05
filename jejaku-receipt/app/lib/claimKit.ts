import { jsPDF } from "jspdf";
import { formatCurrency, type Expense } from "./expenses";
import { formatIsoDate } from "./formatIso";
import type { WarrantyClaim } from "./warranty";

// One printable page for a single warranty claim (a tagged item, or the
// whole receipt when it wasn't itemized): the facts a store's warranty
// desk actually asks for, the receipt photo if there is one, and a
// pre-written claim message — built with the same jsPDF primitives
// exportPdf.ts already uses, not a new rendering approach. Client-side
// only ("use client" call sites): fetches the receipt photo same-origin
// and reads it as a data URL, both of which need a browser.

const PAGE_MARGIN = 40;
const CONTENT_WIDTH = 515; // A4 portrait width (595pt) minus margins on both sides.

const EMBEDDABLE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't decode receipt image."));
    img.src = dataUrl;
  });
}

// Only attempts image formats jsPDF can actually embed — a PDF receipt
// upload (uploads.ts accepts those too) is skipped rather than attempted
// and failing, since jsPDF can't embed an arbitrary PDF as an image.
async function fetchEmbeddableImage(photoUrl: string): Promise<{ dataUrl: string; format: string } | null> {
  const extension = photoUrl.split(".").pop()?.toLowerCase() ?? "";
  if (!EMBEDDABLE_EXTENSIONS.has(extension)) return null;

  const res = await fetch(photoUrl);
  if (!res.ok) return null;
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read receipt image."));
    reader.readAsDataURL(blob);
  });
  return { dataUrl, format: extension === "jpg" ? "JPEG" : extension.toUpperCase() };
}

function claimFileSlug(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

export async function downloadClaimKit(expense: Expense, claim: WarrantyClaim): Promise<void> {
  const doc = new jsPDF({ unit: "pt" });
  let y = 50;

  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text("Warranty Claim", PAGE_MARGIN, y);
  y += 20;

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${formatIsoDate(new Date())}`, PAGE_MARGIN, y);
  y += 28;

  const facts: [string, string][] = [
    ["Item", claim.label],
    ["Merchant", expense.merchant],
    ["Purchase date", formatIsoDate(new Date(`${expense.date}T00:00:00`))],
    ["Amount paid", formatCurrency(expense.amount, expense.currency)],
    ["Coverage", claim.months !== undefined ? `${claim.months} month${claim.months === 1 ? "" : "s"}` : "Not specified"],
    ["Expires", claim.expiry ? formatIsoDate(claim.expiry) : "Not tracked"],
  ];
  doc.setFontSize(11);
  for (const [label, value] of facts) {
    doc.setTextColor(90);
    doc.text(`${label}`, PAGE_MARGIN, y);
    doc.setTextColor(20);
    doc.text(value, PAGE_MARGIN + 110, y);
    y += 18;
  }
  y += 10;

  if (expense.photoUrl) {
    // A failed fetch/decode drops the image rather than failing the whole
    // download — the facts and claim message above are the part that
    // actually matters if the photo can't be embedded.
    const image = await fetchEmbeddableImage(expense.photoUrl).catch(() => null);
    if (image) {
      try {
        const el = await loadImageElement(image.dataUrl);
        const maxHeight = 300;
        const scale = Math.min(CONTENT_WIDTH / el.naturalWidth, maxHeight / el.naturalHeight, 1);
        const width = el.naturalWidth * scale;
        const height = el.naturalHeight * scale;
        doc.addImage(image.dataUrl, image.format, PAGE_MARGIN, y, width, height);
        y += height + 18;
      } catch {
        // Same tolerance as the fetch above — an undecodable image just
        // means no photo on this page.
      }
    }
  }

  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("Claim message", PAGE_MARGIN, y);
  y += 16;

  const expiryClause = claim.expiry ? `, with coverage through ${formatIsoDate(claim.expiry)}` : "";
  const message =
    `I'm requesting a warranty claim for ${claim.label}, purchased from ${expense.merchant} on ` +
    `${formatIsoDate(new Date(`${expense.date}T00:00:00`))}${expiryClause}. The receipt is attached. ` +
    "Please let me know what's needed to proceed.";
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(doc.splitTextToSize(message, CONTENT_WIDTH), PAGE_MARGIN, y);

  doc.save(`warranty-claim-${claimFileSlug(claim.label)}.pdf`);
}
