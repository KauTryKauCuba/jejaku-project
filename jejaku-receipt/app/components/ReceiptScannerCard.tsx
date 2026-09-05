"use client";

import { useRef, useState } from "react";
import { CaretLeft, Camera, FilePdf, Image as ImageIcon, PencilSimple, Users, X } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import ReceiptIllustration from "./ReceiptIllustration";
import ExpenseForm from "./ExpenseForm";
import CameraCapture from "./CameraCapture";
import SplitBillModal from "./SplitBillModal";
import ScannerTutorialModal, { type TutorialKind } from "./ScannerTutorialModal";
import { formatCurrency, type Expense, type ExpenseCategory, type ExpenseItem, type SplitData } from "../lib/expenses";
import { withWeekday } from "../lib/formatIso";
import { describeScanStatus, scanStatusIsError, scanStatusText } from "../lib/receiptScanStatus";
import { useAddExpense, useExpenses } from "./ExpensesProvider";

// Bump whenever receipt-extract's prompt, capture pipeline, or sanity
// checks change meaningfully — a quick visible marker of how current the
// scan quality is, without digging through the changelog.
const SCAN_TUNING_DATE = "2026-09-04";

const TUTORIAL_DISMISSED_KEY: Record<TutorialKind, string> = {
  scan: "jejaku-receipt:hide-scan-tutorial",
  split: "jejaku-receipt:hide-split-tutorial",
};

function isTutorialDismissed(kind: TutorialKind): boolean {
  try {
    return localStorage.getItem(TUTORIAL_DISMISSED_KEY[kind]) === "1";
  } catch {
    // Private browsing / disabled storage — just show the tutorial every
    // time rather than failing the button press.
    return false;
  }
}

function dismissTutorial(kind: TutorialKind) {
  try {
    localStorage.setItem(TUTORIAL_DISMISSED_KEY[kind], "1");
  } catch {
    // Nothing to do if storage isn't available — it'll just ask again.
  }
}

type Mode = "idle" | "camera" | "details" | "split";
type PreviewKind = "image" | "pdf" | null;
type Extracted = {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  category: ExpenseCategory | null;
  city: string | null;
  state: string | null;
  country: string | null;
  currency: string | null;
  tax: number | null;
  items: ExpenseItem[];
  itemsMismatch: boolean;
  // See lib/receiptExtractParse.ts — true when the model's response was
  // cut off before finishing (a long item list is the likely cause), in
  // which case itemsMismatch shouldn't be trusted the same way: the
  // numbers can't be expected to reconcile when part of the receipt was
  // never read at all, not just misread.
  itemsTruncated: boolean;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ReceiptScannerCard({ onSaved }: { onSaved?: () => void }) {
  const addExpense = useAddExpense();
  const expenses = useExpenses();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<PreviewKind>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  // Set when the extraction request itself didn't succeed (blocked, or
  // never reached the server) — distinct from `extracted` coming back
  // well-formed but low-confidence (found-nothing/itemsMismatch, see
  // lib/receiptScanStatus.ts), which is a different message. Previously
  // this case fell through silently to a blank form with no explanation.
  const [extractError, setExtractError] = useState<string | undefined>(undefined);
  // How many image parts the last extraction request was made of — 1 for
  // an ordinary scan. Read by the status line both while extracting
  // ("reading it in N parts…") and after ("found N items across M
  // parts"), see lib/receiptScanStatus.ts.
  const [tileCount, setTileCount] = useState(1);
  const [splitTarget, setSplitTarget] = useState<Expense | null>(null);
  const [tutorial, setTutorial] = useState<TutorialKind | null>(null);

  const startQuickScan = () => {
    if (isTutorialDismissed("scan")) {
      setMode("camera");
    } else {
      setTutorial("scan");
    }
  };

  const startQuickSplit = () => {
    if (isTutorialDismissed("split")) {
      setMode("split");
    } else {
      setTutorial("split");
    }
  };

  const continueTutorial = (dontShowAgain: boolean) => {
    if (!tutorial) return;
    if (dontShowAgain) dismissTutorial(tutorial);
    setMode(tutorial === "scan" ? "camera" : "split");
    setTutorial(null);
  };

  const revokePreview = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const applyFile = (file: File, kind: PreviewKind) => {
    revokePreview();
    setPhoto(file);
    setPreviewKind(kind);
    setPreviewUrl(kind === "image" ? URL.createObjectURL(file) : null);
    setMode("details");
  };

  const enterManually = () => {
    revokePreview();
    setPhoto(null);
    setPreviewKind(null);
    setExtracted(null);
    setExtractError(undefined);
    setMode("details");
  };

  // Shared by the camera and "Import photo" paths — both end up holding
  // one or more image Files the same way, and extraction doesn't care
  // where they came from. `files` is more than one entry only for a
  // receipt long enough to need splitting into parts before capture —
  // still one extraction request either way, just with more image blocks
  // in it (see the route for how those get merged into a single result).
  // PDF import deliberately doesn't call this: DeepSeek's vision model
  // can't read a PDF directly, so that would need a render-to-image step
  // this doesn't have yet.
  const runExtraction = async (files: File[]) => {
    setExtracted(null);
    setExtractError(undefined);
    setTileCount(files.length);
    setExtracting(true);
    try {
      const images = await Promise.all(files.map(fileToDataUrl));
      const res = await fetch("/api/receipt-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      if (res.ok) {
        setExtracted((await res.json()) as Extracted);
      } else {
        // Extraction is a convenience, not a blocker — the form below still
        // works with everything filled in by hand — but a blocked/failed
        // request used to fall through silently with no explanation at
        // all, indistinguishable from "nothing was ever attempted".
        setExtractError(
          res.status === 429
            ? "Daily scan limit reached — enter this receipt manually, or try again tomorrow."
            : res.status === 413
              ? "That photo is too large to scan — try a smaller one, or enter it manually."
              : res.status === 401
                ? "Your session expired — refresh the page and sign in again to use Quick Scan."
                : "Couldn't reach the scanner — enter this receipt manually."
        );
      }
    } catch {
      setExtractError("Couldn't reach the scanner — check your connection, or enter this receipt manually.");
    } finally {
      setExtracting(false);
    }
  };

  const handleCameraCapture = (file: File) => {
    applyFile(file, "image");
    runExtraction([file]);
  };

  const handlePhotoImport = (file: File) => {
    applyFile(file, "image");
    runExtraction([file]);
  };

  const reset = () => {
    revokePreview();
    setPhoto(null);
    setPreviewKind(null);
    setExtracted(null);
    setExtractError(undefined);
    setExtracting(false);
    setTileCount(1);
    setMode("idle");
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleSave = async (data: {
    merchant: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    tax?: number;
    isWarrantyClaim?: boolean;
    warrantyMonths?: number;
    note?: string;
    city?: string;
    state?: string;
    country?: string;
    items?: ExpenseItem[];
    currency?: string;
    split?: SplitData;
  }) => {
    setSaving(true);
    setError(undefined);
    try {
      await addExpense(data, photo);
      reset();
      onSaved?.();
    } catch {
      setError("Couldn't save expense. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0 rounded-lg border border-hairline bg-canvas p-[20px]">
      <IconFlowBadge size={40} seed={4}>
        <Camera size={16} weight="light" />
      </IconFlowBadge>
      <h3 className="mt-[12px] text-[15px] font-light tracking-[-0.19px] text-ink">
        Receipt Scanner
      </h3>
      <p className="mt-[4px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        Snap a receipt, import a file, or enter it yourself.
      </p>

      <div className="mt-[15px]">
        <ReceiptIllustration />
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoImport(file);
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) applyFile(file, "pdf");
        }}
      />

      {mode === "idle" && (
        <>
          <div className="mt-[19px] flex items-center gap-[8px]">
            <button
              type="button"
              onClick={startQuickScan}
              className="flex h-[37px] flex-1 items-center justify-center gap-[8px] rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
            >
              <Camera size={16} weight="light" />
              Quick Scan
            </button>
            <button
              type="button"
              onClick={startQuickSplit}
              className="flex h-[37px] flex-1 items-center justify-center gap-[8px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink transition-colors hover:bg-canvas-soft"
            >
              <Users size={16} weight="light" />
              Quick Split
            </button>
          </div>
          <p className="mt-[6px] text-[11px] text-ink-mute">
            Scan accuracy tuned {withWeekday(SCAN_TUNING_DATE)}
          </p>

          <div className="mt-[15px] flex items-center gap-[11px]">
            <div className="h-px flex-1 bg-hairline" />
            <span className="text-[12px] text-ink-mute">or add a receipt</span>
            <div className="h-px flex-1 bg-hairline" />
          </div>

          <div className="mt-[11px] flex flex-wrap items-center gap-[8px]">
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="flex h-[33px] items-center justify-center gap-[6px] rounded-pill border border-hairline-input bg-canvas px-[13px] text-[13px] font-medium text-ink transition-colors hover:bg-canvas-soft"
            >
              <FilePdf size={14} weight="light" />
              Import PDF
            </button>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex h-[33px] items-center justify-center gap-[6px] rounded-pill border border-hairline-input bg-canvas px-[13px] text-[13px] font-medium text-ink transition-colors hover:bg-canvas-soft"
            >
              <ImageIcon size={14} weight="light" />
              Import photo
            </button>
            <button
              type="button"
              onClick={enterManually}
              className="flex h-[33px] items-center justify-center gap-[6px] rounded-pill border border-hairline-input bg-canvas px-[13px] text-[13px] font-medium text-ink transition-colors hover:bg-canvas-soft"
            >
              <PencilSimple size={14} weight="light" />
              Enter manually
            </button>
          </div>
        </>
      )}

      {mode === "camera" && (
        <CameraCapture onCapture={handleCameraCapture} onCancel={() => setMode("idle")} />
      )}

      {mode === "split" && (
        <div className="mt-[19px]">
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="flex h-[26px] items-center gap-[4px] text-[12px] font-medium text-ink-mute transition-colors hover:text-ink"
          >
            <CaretLeft size={12} weight="bold" />
            Back
          </button>

          <p className="mt-[8px] text-[12px] text-ink-mute">Pick a receipt to split.</p>

          {expenses.length === 0 ? (
            <p className="mt-[15px] text-[12px] text-ink-mute">No receipts yet — scan one first.</p>
          ) : (
            <ul className="mt-[11px] flex max-h-[280px] flex-col divide-y divide-hairline overflow-y-auto -mx-[11px]">
              {expenses.map((e) => {
                const hasItems = (e.items?.length ?? 0) > 0;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      disabled={!hasItems}
                      onClick={() => setSplitTarget(e)}
                      className="flex w-full items-center justify-between gap-[11px] rounded-md px-[11px] py-[9px] text-left transition-colors hover:bg-canvas-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">{e.merchant}</p>
                        <p className="text-[11px] text-ink-mute">
                          {hasItems ? `${e.items?.length} item${e.items?.length === 1 ? "" : "s"}` : "No items to split"}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-[13px] font-medium text-ink">
                        {formatCurrency(e.amount, e.currency)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {splitTarget && <SplitBillModal expense={splitTarget} onClose={() => setSplitTarget(null)} />}

      {tutorial && (
        <ScannerTutorialModal
          kind={tutorial}
          onContinue={continueTutorial}
          onClose={() => setTutorial(null)}
        />
      )}

      {mode === "details" && (
        <div className="mt-[19px]">
          {previewKind === "image" && previewUrl && (
            <div className="w-full overflow-hidden rounded-lg border border-hairline">
              {/* object-contain, not object-cover — a long receipt is much
                  taller than it is wide, and cropping to fill a fixed box
                  would only ever show a middle slice of it. Letterboxed
                  against the canvas-soft background instead, so the whole
                  captured photo is actually visible regardless of its
                  aspect ratio. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Captured receipt"
                className="max-h-[320px] w-full bg-canvas-soft object-contain"
              />
              <div className="flex items-center justify-end border-t border-hairline p-[11px]">
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Discard photo"
                  className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
                >
                  <X size={14} weight="light" />
                </button>
              </div>
            </div>
          )}

          {previewKind === "pdf" && photo && (
            <div className="flex items-center gap-[11px] rounded-lg border border-hairline bg-canvas-soft p-[11px]">
              <span className="flex h-[37px] w-[37px] shrink-0 items-center justify-center rounded-md bg-canvas text-ink-mute">
                <FilePdf size={18} weight="light" />
              </span>
              <p className="min-w-0 flex-1 truncate text-[13px] text-ink">{photo.name}</p>
              <button
                type="button"
                onClick={reset}
                aria-label="Discard file"
                className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
              >
                <X size={13} weight="light" />
              </button>
            </div>
          )}

          {(() => {
            const status = describeScanStatus({
              extracting,
              tileCount,
              extractError,
              extracted,
              hasPreview: previewKind !== null,
            });
            return (
              <p className={scanStatusIsError(status) ? "mt-[15px] text-[12px] text-error" : "mt-[15px] text-[12px] text-ink-mute"}>
                {scanStatusText(status)}
              </p>
            );
          })()}
          <div className="mt-[8px]">
            {error && <p className="mb-[8px] text-[12px] text-error">{error}</p>}
            {extracting ? (
              <div className="flex h-[141px] items-center justify-center rounded-lg border border-hairline bg-canvas-soft">
                <div className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-ink-mute border-t-transparent" />
              </div>
            ) : (
              <ExpenseForm
                key={extracted ? "extracted" : "blank"}
                onSubmit={handleSave}
                onCancel={reset}
                disabled={saving}
                initialMerchant={extracted?.merchant ?? undefined}
                initialAmount={extracted?.amount ?? undefined}
                initialDate={extracted?.date ?? undefined}
                initialCategory={extracted?.category ?? undefined}
                initialCity={extracted?.city ?? undefined}
                initialState={extracted?.state ?? undefined}
                initialCountry={extracted?.country ?? undefined}
                initialCurrency={extracted?.currency ?? undefined}
                initialTax={extracted?.tax ?? undefined}
                initialItems={extracted?.items}
                categorySource={extracted ? (extracted.category ? "ai" : "fallback") : undefined}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
