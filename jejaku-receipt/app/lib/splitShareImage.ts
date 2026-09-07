import { formatCurrency, lineTotal, type Expense, type SplitData } from "./expenses";
import { withWeekday } from "./formatIso";

// Renders one person's share of a split receipt as a shareable image —
// built with the plain 2D canvas API rather than jsPDF (exportPdf.ts's
// approach): the output here is a PNG meant for a chat app's image
// preview, not a printable document, so a canvas that can go straight into
// navigator.share/toBlob is the right primitive, not a PDF page.

const CARD_WIDTH = 640;
const PADDING = 40;
const HEADER_HEIGHT = 96;
// Rendered at 2x and scaled back down via CSS/toBlob's natural pixel size —
// crisp on a phone screen without the file ballooning like a 3x+ render would.
const SCALE = 2;

const PRIMARY = "#1d4ed8";
const INK = "#0a1826";
const INK_MUTE = "#5c6e7a";
const HAIRLINE = "#dbe4ef";
const ON_PRIMARY = "#ffffff";

export type ShareLine = {
  name: string;
  amount: number;
  sharedWith: number;
};

export type SplitShareInput = {
  expense: Pick<Expense, "merchant" | "date" | "city" | "country" | "currency">;
  person: string;
  lines: ShareLine[];
  taxShare: number;
  total: number;
  /** Data URL of an uploaded QR code (e.g. a payment QR) to print at the
   * bottom of the card, optional — most receipts get shared with no QR. */
  qrDataUrl?: string | null;
};

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't decode image."));
    img.src = src;
  });
}

// Static asset — same tolerance as exportPdf.ts's loadLogoDataUrl: a failed
// fetch just means no logo in the header, not a broken card.
async function loadLogo(): Promise<HTMLImageElement | null> {
  try {
    return await loadImageElement("/jk-logo.png");
  } catch {
    return null;
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function locationOf(e: SplitShareInput["expense"]): string {
  return [e.city, e.country].filter(Boolean).join(", ");
}

export async function renderSplitShareCard(input: SplitShareInput): Promise<HTMLCanvasElement> {
  const { expense, person, lines, taxShare, total, qrDataUrl } = input;
  const currency = expense.currency ?? "USD";

  const [logo, qr] = await Promise.all([
    loadLogo(),
    qrDataUrl ? loadImageElement(qrDataUrl).catch(() => null) : Promise.resolve(null),
  ]);

  // Item rows can wrap to two lines (a long name at CARD_WIDTH's item-name
  // column), so height is computed from a dry-run measure pass, not a flat
  // per-line constant — otherwise a long name would overlap the row below it.
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d")!;
  mctx.font = "400 15px system-ui, sans-serif";
  const nameColumnWidth = CARD_WIDTH - PADDING * 2 - 120;
  let itemsHeight = 0;
  const wrappedLines = lines.map((line) => {
    const label = line.sharedWith > 1 ? `${line.name} (split ${line.sharedWith} ways)` : line.name;
    const wrapped = wrapText(mctx, label, nameColumnWidth);
    itemsHeight += 22 * wrapped.length + 8;
    return { ...line, wrapped };
  });

  const qrBlockHeight = qr ? 220 : 0;
  const totalsHeight = 96;
  const footerHeight = 56;
  const merchantBlockHeight = 74;
  const personLabelHeight = 40;
  const height =
    HEADER_HEIGHT + merchantBlockHeight + personLabelHeight + itemsHeight + totalsHeight + qrBlockHeight + footerHeight + PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CARD_WIDTH, height);

  // Header band
  ctx.fillStyle = PRIMARY;
  ctx.fillRect(0, 0, CARD_WIDTH, HEADER_HEIGHT);
  if (logo) {
    const logoSize = 40;
    ctx.drawImage(logo, PADDING, (HEADER_HEIGHT - logoSize) / 2, logoSize, logoSize);
  }
  ctx.fillStyle = ON_PRIMARY;
  ctx.font = "500 20px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Jejaku Receipt", PADDING + (logo ? 52 : 0), HEADER_HEIGHT / 2 - 8);
  ctx.font = "400 12px system-ui, sans-serif";
  ctx.fillStyle = "#dbe4ffcc";
  ctx.fillText("Split bill", PADDING + (logo ? 52 : 0), HEADER_HEIGHT / 2 + 12);

  let y = HEADER_HEIGHT + 40;

  // Merchant + meta
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = "300 26px system-ui, sans-serif";
  ctx.fillText(expense.merchant || "Receipt", PADDING, y);
  y += 26;
  const location = locationOf(expense);
  ctx.font = "400 13px system-ui, sans-serif";
  ctx.fillStyle = INK_MUTE;
  ctx.fillText([withWeekday(expense.date), location].filter(Boolean).join(" · "), PADDING, y);
  y += 34;

  // Person label
  ctx.font = "500 15px system-ui, sans-serif";
  ctx.fillStyle = PRIMARY;
  ctx.fillText(`${person}'s share`, PADDING, y);
  y += 26;

  // Item lines
  ctx.font = "400 15px system-ui, sans-serif";
  for (const line of wrappedLines) {
    const amountLabel = formatCurrency(line.amount, currency);
    ctx.fillStyle = INK;
    line.wrapped.forEach((text, i) => {
      ctx.fillText(text, PADDING, y + 22 * i);
    });
    ctx.font = "500 15px system-ui, sans-serif";
    ctx.fillStyle = INK;
    ctx.textAlign = "right";
    ctx.fillText(amountLabel, CARD_WIDTH - PADDING, y);
    ctx.textAlign = "left";
    ctx.font = "400 15px system-ui, sans-serif";
    y += 22 * line.wrapped.length + 8;
  }

  // Divider
  y += 6;
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(CARD_WIDTH - PADDING, y);
  ctx.stroke();
  y += 28;

  if (taxShare > 0) {
    ctx.font = "400 14px system-ui, sans-serif";
    ctx.fillStyle = INK_MUTE;
    ctx.fillText("Tax share", PADDING, y);
    ctx.textAlign = "right";
    ctx.fillText(formatCurrency(taxShare, currency), CARD_WIDTH - PADDING, y);
    ctx.textAlign = "left";
    y += 32;
  }

  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillStyle = INK;
  ctx.fillText("Total", PADDING, y);
  ctx.fillStyle = PRIMARY;
  ctx.textAlign = "right";
  ctx.fillText(formatCurrency(total, currency), CARD_WIDTH - PADDING, y);
  ctx.textAlign = "left";
  y += 40;

  if (qr) {
    const qrSize = 160;
    const qrX = (CARD_WIDTH - qrSize) / 2;
    ctx.strokeStyle = HAIRLINE;
    ctx.strokeRect(qrX - 1, y - 1, qrSize + 2, qrSize + 2);
    ctx.drawImage(qr, qrX, y, qrSize, qrSize);
    y += qrSize + 20;
    ctx.font = "400 13px system-ui, sans-serif";
    ctx.fillStyle = INK_MUTE;
    ctx.textAlign = "center";
    ctx.fillText("Scan to pay", CARD_WIDTH / 2, y);
    ctx.textAlign = "left";
    y += 24;
  }

  // Footer
  ctx.font = "400 11px system-ui, sans-serif";
  ctx.fillStyle = INK_MUTE;
  ctx.textAlign = "center";
  ctx.fillText("Generated by Jejaku Receipt", CARD_WIDTH / 2, height - PADDING / 2);
  ctx.textAlign = "left";

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Couldn't create image."));
    }, "image/png");
  });
}

// Every assignment `person` is part of, as a display-ready line (their
// share of that item's total, split evenly among everyone tagged on it) —
// mirrors computeSplitTotals' per-line math (lib/expenses.ts) but keeps the
// per-item breakdown instead of collapsing straight to one number, since
// the share card shows what's actually being paid for, not just the total.
export function splitLinesFor(person: string, items: Expense["items"], split: SplitData): ShareLine[] {
  const lines: ShareLine[] = [];
  for (const assignment of split.assignments) {
    if (!assignment.people.includes(person)) continue;
    const item = items?.[assignment.itemIndex];
    if (!item) continue;
    lines.push({
      name: item.name || `Item ${assignment.itemIndex + 1}`,
      amount: lineTotal(item) / assignment.people.length,
      sharedWith: assignment.people.length,
    });
  }
  return lines;
}
