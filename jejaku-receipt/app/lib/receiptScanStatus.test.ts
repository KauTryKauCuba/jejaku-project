import { describe, expect, it } from "vitest";
import { describeScanStatus, scanStatusIsError, scanStatusText, type ExtractedForStatus } from "./receiptScanStatus";

function extracted(overrides: Partial<ExtractedForStatus> = {}): ExtractedForStatus {
  return {
    merchant: "IKEA",
    amount: 68.5,
    items: { length: 2 },
    itemsMismatch: false,
    itemsTruncated: false,
    ...overrides,
  };
}

describe("describeScanStatus", () => {
  it("is 'extracting' while extraction is in flight, regardless of any prior result", () => {
    const status = describeScanStatus({
      extracting: true,
      tileCount: 1,
      extractError: undefined,
      extracted: extracted(),
      hasPreview: true,
    });
    expect(status).toEqual({ kind: "extracting", tileCount: 1 });
  });

  it("reports the tile count while extracting a multi-part scan", () => {
    const status = describeScanStatus({ extracting: true, tileCount: 4, extractError: undefined, extracted: null, hasPreview: true });
    expect(status).toEqual({ kind: "extracting", tileCount: 4 });
  });

  it("surfaces an extract error even if a stale successful result is still around", () => {
    const status = describeScanStatus({
      extracting: false,
      tileCount: 1,
      extractError: "Daily scan limit reached.",
      extracted: extracted(),
      hasPreview: true,
    });
    expect(status).toEqual({ kind: "error", message: "Daily scan limit reached." });
  });

  it("prioritizes truncation over items-mismatch when both would otherwise apply", () => {
    const status = describeScanStatus({
      extracting: false,
      tileCount: 1,
      extractError: undefined,
      extracted: extracted({ itemsTruncated: true, itemsMismatch: true }),
      hasPreview: true,
    });
    expect(status.kind).toBe("truncated-with-items");
  });

  it("prioritizes truncation over found-nothing when both would otherwise apply", () => {
    const status = describeScanStatus({
      extracting: false,
      tileCount: 1,
      extractError: undefined,
      extracted: extracted({ itemsTruncated: true, merchant: null, amount: null, items: { length: 0 } }),
      hasPreview: true,
    });
    expect(status.kind).toBe("truncated-empty");
  });

  it("distinguishes truncated-with-items from truncated-empty by whether any items survived", () => {
    const withItems = describeScanStatus({
      extracting: false,
      tileCount: 1,
      extractError: undefined,
      extracted: extracted({ itemsTruncated: true, items: { length: 12 } }),
      hasPreview: true,
    });
    expect(withItems).toEqual({ kind: "truncated-with-items", itemCount: 12 });

    const empty = describeScanStatus({
      extracting: false,
      tileCount: 1,
      extractError: undefined,
      extracted: extracted({ itemsTruncated: true, items: { length: 0 } }),
      hasPreview: true,
    });
    expect(empty).toEqual({ kind: "truncated-empty" });
  });

  it("reports found-nothing when merchant, amount, and items are all absent", () => {
    const status = describeScanStatus({
      extracting: false,
      tileCount: 1,
      extractError: undefined,
      extracted: extracted({ merchant: null, amount: null, items: { length: 0 } }),
      hasPreview: true,
    });
    expect(status.kind).toBe("found-nothing");
  });

  it("does not report found-nothing if only the merchant came back — amount or items still count as something", () => {
    const status = describeScanStatus({
      extracting: false,
      tileCount: 1,
      extractError: undefined,
      extracted: extracted({ merchant: null, amount: 20 }),
      hasPreview: true,
    });
    expect(status.kind).not.toBe("found-nothing");
  });

  it("reports items-mismatch when nothing else takes priority", () => {
    const status = describeScanStatus({
      extracting: false,
      tileCount: 1,
      extractError: undefined,
      extracted: extracted({ itemsMismatch: true }),
      hasPreview: true,
    });
    expect(status.kind).toBe("items-mismatch");
  });

  it("reports success-multi-tile only when tileCount > 1 and nothing else takes priority", () => {
    const status = describeScanStatus({
      extracting: false,
      tileCount: 3,
      extractError: undefined,
      extracted: extracted(),
      hasPreview: true,
    });
    expect(status).toEqual({ kind: "success-multi-tile", itemCount: 2, tileCount: 3 });
  });

  it("reports plain success for a single-tile clean result", () => {
    const status = describeScanStatus({
      extracting: false,
      tileCount: 1,
      extractError: undefined,
      extracted: extracted(),
      hasPreview: true,
    });
    expect(status.kind).toBe("success");
  });

  it("falls back to fill-in when there's no extraction result at all", () => {
    const withPreview = describeScanStatus({ extracting: false, tileCount: 1, extractError: undefined, extracted: null, hasPreview: true });
    expect(withPreview).toEqual({ kind: "fill-in", hasPreview: true });

    const withoutPreview = describeScanStatus({ extracting: false, tileCount: 1, extractError: undefined, extracted: null, hasPreview: false });
    expect(withoutPreview).toEqual({ kind: "fill-in", hasPreview: false });
  });
});

describe("scanStatusText", () => {
  it("singularizes the item count correctly at exactly one item", () => {
    expect(scanStatusText({ kind: "truncated-with-items", itemCount: 1 })).toContain("first 1 item.");
    expect(scanStatusText({ kind: "truncated-with-items", itemCount: 2 })).toContain("first 2 items.");
    expect(scanStatusText({ kind: "success-multi-tile", itemCount: 1, tileCount: 2 })).toContain("Found 1 item ");
    expect(scanStatusText({ kind: "success-multi-tile", itemCount: 5, tileCount: 2 })).toContain("Found 5 items ");
  });

  it("mentions the tile count while extracting a multi-part scan, and omits it for a single part", () => {
    expect(scanStatusText({ kind: "extracting", tileCount: 3 })).toBe("Long receipt — reading it in 3 parts…");
    expect(scanStatusText({ kind: "extracting", tileCount: 1 })).toBe("Reading the receipt…");
  });

  it("returns the error message verbatim", () => {
    expect(scanStatusText({ kind: "error", message: "Couldn't reach the scanner." })).toBe("Couldn't reach the scanner.");
  });
});

describe("scanStatusIsError", () => {
  it("treats truncated, found-nothing, mismatch, and error as error-styled", () => {
    expect(scanStatusIsError({ kind: "truncated-with-items", itemCount: 3 })).toBe(true);
    expect(scanStatusIsError({ kind: "truncated-empty" })).toBe(true);
    expect(scanStatusIsError({ kind: "found-nothing" })).toBe(true);
    expect(scanStatusIsError({ kind: "items-mismatch" })).toBe(true);
    expect(scanStatusIsError({ kind: "error", message: "x" })).toBe(true);
  });

  it("treats extracting, success, success-multi-tile, and fill-in as routine, not error-styled", () => {
    expect(scanStatusIsError({ kind: "extracting", tileCount: 1 })).toBe(false);
    expect(scanStatusIsError({ kind: "success" })).toBe(false);
    expect(scanStatusIsError({ kind: "success-multi-tile", itemCount: 5, tileCount: 2 })).toBe(false);
    expect(scanStatusIsError({ kind: "fill-in", hasPreview: true })).toBe(false);
  });
});
