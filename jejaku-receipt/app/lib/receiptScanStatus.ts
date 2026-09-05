// The status line shown under a Quick Scan capture, as a priority chain
// rather than a chain of nested ternaries in the component — the ordering
// here is the actual product decision (a truncated result always takes
// priority over a plain mismatch warning, for instance, since they can
// look similar but call for different actions from the user), so it's
// worth being explicit and testable about it in one place.

export type ExtractedForStatus = {
  merchant: string | null;
  amount: number | null;
  items: { length: number };
  itemsMismatch: boolean;
  itemsTruncated: boolean;
};

export type ScanStatus =
  | { kind: "extracting"; tileCount: number }
  | { kind: "error"; message: string }
  | { kind: "truncated-with-items"; itemCount: number }
  | { kind: "truncated-empty" }
  | { kind: "found-nothing" }
  | { kind: "items-mismatch" }
  | { kind: "success-multi-tile"; itemCount: number; tileCount: number }
  | { kind: "success" }
  | { kind: "fill-in"; hasPreview: boolean };

// Mirrors the same check ReceiptScannerCard already made inline — the
// model still returns a well-formed, mostly-null response for a photo
// that isn't a receipt at all, so this is the only signal extraction
// found nothing worth pre-filling.
function foundNothing(extracted: ExtractedForStatus): boolean {
  return !extracted.merchant && !extracted.amount && extracted.items.length === 0;
}

export function describeScanStatus(input: {
  extracting: boolean;
  tileCount: number;
  extractError: string | undefined;
  extracted: ExtractedForStatus | null;
  hasPreview: boolean;
}): ScanStatus {
  const { extracting, tileCount, extractError, extracted, hasPreview } = input;

  if (extracting) return { kind: "extracting", tileCount };
  if (extractError) return { kind: "error", message: extractError };

  if (extracted) {
    // Truncation takes priority over every other read on the result —
    // both a "looks like the numbers don't add up" mismatch and "this
    // doesn't look like a receipt" found-nothing check are unreliable
    // once part of the receipt was never actually read, rather than
    // misread, so surfacing either of those instead would send the user
    // down the wrong explanation.
    if (extracted.itemsTruncated) {
      return extracted.items.length > 0
        ? { kind: "truncated-with-items", itemCount: extracted.items.length }
        : { kind: "truncated-empty" };
    }
    if (foundNothing(extracted)) return { kind: "found-nothing" };
    if (extracted.itemsMismatch) return { kind: "items-mismatch" };
    return tileCount > 1
      ? { kind: "success-multi-tile", itemCount: extracted.items.length, tileCount }
      : { kind: "success" };
  }

  return { kind: "fill-in", hasPreview };
}

export function scanStatusText(status: ScanStatus): string {
  switch (status.kind) {
    case "extracting":
      return status.tileCount > 1 ? `Long receipt — reading it in ${status.tileCount} parts…` : "Reading the receipt…";
    case "error":
      return status.message;
    case "truncated-with-items":
      return `This receipt is very long — we read the first ${status.itemCount} item${status.itemCount === 1 ? "" : "s"}. Add the rest yourself, and double check the total, before saving.`;
    case "truncated-empty":
      return "This receipt is very long — try a shorter or clearer photo, or enter it manually below.";
    case "found-nothing":
      return "Couldn't read this as a receipt — try again with a clearer photo, or fill in the details yourself below.";
    case "items-mismatch":
      return "Item prices don't quite add up to the total — double-check quantities and prices below before saving.";
    case "success-multi-tile":
      return `Found ${status.itemCount} item${status.itemCount === 1 ? "" : "s"} across ${status.tileCount} parts — check them before saving.`;
    case "success":
      return "Details auto-filled from the receipt — check them before saving.";
    case "fill-in":
      return status.hasPreview ? "Fill in the details below." : "Enter the expense details below.";
  }
}

// Which statuses read as a problem worth the error color, versus routine
// informational text.
export function scanStatusIsError(status: ScanStatus): boolean {
  return (
    status.kind === "error" ||
    status.kind === "truncated-with-items" ||
    status.kind === "truncated-empty" ||
    status.kind === "found-nothing" ||
    status.kind === "items-mismatch"
  );
}
