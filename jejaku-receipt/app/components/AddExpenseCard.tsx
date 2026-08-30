"use client";

import { useRef, useState } from "react";
import { Camera, PencilSimple, ArrowClockwise, X } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";
import ExpenseForm from "./ExpenseForm";
import type { ExpenseCategory } from "../lib/expenses";
import { useAddExpense } from "./ExpensesProvider";

type Mode = "choose" | "scan" | "manual";

export default function AddExpenseCard({
  initialDate,
  showHeader = true,
  onSaved,
}: {
  initialDate?: string;
  showHeader?: boolean;
  onSaved?: () => void;
}) {
  const addExpense = useAddExpense();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("choose");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const revokePreview = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    revokePreview();
    setPreviewUrl(URL.createObjectURL(file));
  };

  const reset = () => {
    revokePreview();
    setMode("choose");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSave = async (data: {
    merchant: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    note?: string;
  }) => {
    setSaving(true);
    setError(undefined);
    try {
      const photo = mode === "scan" ? inputRef.current?.files?.[0] : undefined;
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
    <div className={showHeader ? "rounded-lg border border-hairline bg-canvas p-[24px]" : ""}>
      {showHeader && (
        <>
          <IconFlowBadge size={40} seed={4}>
            <Camera size={16} weight="light" />
          </IconFlowBadge>

          <h3 className="mt-[15px] text-[15px] font-light tracking-[-0.19px] text-ink">
            Add an expense
          </h3>
          <p className="mt-[4px] max-w-md text-[12px] leading-relaxed text-ink-mute">
            Scan a receipt or enter the details yourself.
          </p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {mode === "choose" && (
        <div className={showHeader ? "mt-[19px] flex flex-wrap items-center gap-[11px]" : "flex flex-wrap items-center gap-[11px]"}>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="flex h-[37px] items-center justify-center gap-[8px] rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
          >
            <PencilSimple size={16} weight="light" />
            Enter manually
          </button>
          <span className="text-[12px] text-ink-mute">or</span>
          <button
            type="button"
            onClick={() => {
              setMode("scan");
              inputRef.current?.click();
            }}
            className="flex h-[37px] items-center justify-center gap-[8px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink transition-colors hover:bg-canvas-soft"
          >
            <Camera size={16} weight="light" />
            Scan a receipt
          </button>
        </div>
      )}

      {mode === "scan" && previewUrl && (
        <div className={showHeader ? "mt-[19px]" : ""}>
          <div className="w-full max-w-xs overflow-hidden rounded-lg border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Captured receipt"
              className="max-h-[240px] w-full object-cover"
            />
            <div className="flex items-center gap-[8px] border-t border-hairline p-[11px]">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-[33px] flex-1 items-center justify-center gap-[6px] rounded-pill border border-hairline-input bg-canvas text-[13px] font-medium text-ink transition-colors hover:bg-canvas-soft"
              >
                <ArrowClockwise size={14} weight="light" />
                Retake
              </button>
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

          <p className="mt-[15px] text-[12px] text-ink-mute">
            Fill in the details below — automatic extraction isn&apos;t wired
            up yet.
          </p>
          <div className="mt-[8px]">
            {error && <p className="mb-[8px] text-[12px] text-error">{error}</p>}
            <ExpenseForm onSubmit={handleSave} onCancel={reset} initialDate={initialDate} disabled={saving} />
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div className={showHeader ? "mt-[19px]" : ""}>
          {error && <p className="mb-[8px] text-[12px] text-error">{error}</p>}
          <ExpenseForm onSubmit={handleSave} onCancel={reset} initialDate={initialDate} disabled={saving} />
        </div>
      )}
    </div>
  );
}
