"use client";

import { useRef, useState } from "react";
import { Camera, FilePdf, Image as ImageIcon, PencilSimple, X } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import ExpenseForm from "./ExpenseForm";
import CameraCapture from "./CameraCapture";
import type { ExpenseCategory, ExpenseItem } from "../lib/expenses";
import { useAddExpense } from "./ExpensesProvider";

type Mode = "idle" | "camera" | "details";
type PreviewKind = "image" | "pdf" | null;
type Extracted = {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  category: ExpenseCategory | null;
  location: string | null;
  currency: string | null;
  tax: number | null;
  items: ExpenseItem[];
};

// The model still returns a well-formed (mostly-null) response for a photo
// that isn't a receipt at all — nothing throws, so this is the only signal
// that extraction actually found nothing worth pre-filling.
function extractionFoundNothing(extracted: Extracted): boolean {
  return !extracted.merchant && !extracted.amount && extracted.items.length === 0;
}

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
    setMode("details");
  };

  const handleCameraCapture = async (file: File) => {
    applyFile(file, "image");
    setExtracted(null);
    setExtracting(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/receipt-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (res.ok) {
        setExtracted((await res.json()) as Extracted);
      }
    } catch {
      // Extraction is a convenience — leave the form blank on failure
      // rather than blocking the user from entering the receipt manually.
    } finally {
      setExtracting(false);
    }
  };

  const reset = () => {
    revokePreview();
    setPhoto(null);
    setPreviewKind(null);
    setExtracted(null);
    setExtracting(false);
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
    note?: string;
    location?: string;
    items?: ExpenseItem[];
    currency?: string;
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
      <IconFlowBadge size={40} seed={7}>
        <Camera size={16} weight="light" />
      </IconFlowBadge>

      <h3 className="mt-[15px] text-[15px] font-light tracking-[-0.19px] text-ink">
        Receipt Scanner
      </h3>
      <p className="mt-[4px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        Snap a receipt, import a file, or enter it yourself.
      </p>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) applyFile(file, "image");
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
          <button
            type="button"
            onClick={() => setMode("camera")}
            className="mt-[19px] flex h-[37px] w-full items-center justify-center gap-[8px] rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
          >
            <Camera size={16} weight="light" />
            Quick Scan
          </button>

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

      {mode === "details" && (
        <div className="mt-[19px]">
          {previewKind === "image" && previewUrl && (
            <div className="w-full overflow-hidden rounded-lg border border-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Captured receipt"
                className="max-h-[240px] w-full object-cover"
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

          <p
            className={
              !extracting && extracted && extractionFoundNothing(extracted)
                ? "mt-[15px] text-[12px] text-error"
                : "mt-[15px] text-[12px] text-ink-mute"
            }
          >
            {extracting
              ? "Reading the receipt…"
              : extracted
                ? extractionFoundNothing(extracted)
                  ? "Couldn't read this as a receipt — try again with a clearer photo, or fill in the details yourself below."
                  : "Details auto-filled from the receipt — check them before saving."
                : previewKind
                  ? "Fill in the details below."
                  : "Enter the expense details below."}
          </p>
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
                initialLocation={extracted?.location ?? undefined}
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
