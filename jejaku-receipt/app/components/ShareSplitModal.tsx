"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, DownloadSimple, QrCode, ShareNetwork, X } from "@phosphor-icons/react";
import { computeSplitTotals, lineTotal, type Expense, type SplitData } from "../lib/expenses";
import { MAX_PAYMENT_QR_CODES } from "../lib/paymentQr";
import { useAddPaymentQrCode, usePaymentQrCodes } from "./ExpensesProvider";
import { canvasToBlob, renderSplitShareCard, splitLinesFor } from "../lib/splitShareImage";
import LabelQrModal from "./LabelQrModal";
import Modal from "./Modal";
import QrCropModal from "./QrCropModal";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "share"
  );
}

export default function ShareSplitModal({
  expense,
  split,
  person,
  onClose,
}: {
  expense: Expense;
  split: SplitData;
  person: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const savedQrCodes = usePaymentQrCodes();
  const addPaymentQrCode = useAddPaymentQrCode();
  // Pre-picks the first of the account's saved payment QRs so sharing
  // doesn't mean re-uploading a code every time.
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(savedQrCodes[0]?.url ?? null);
  // Which saved QR (by id) is currently applied, if any — drives which
  // chip the picker highlights.
  const [selectedQrId, setSelectedQrId] = useState<string | null>(savedQrCodes[0]?.id ?? null);
  // The freshly-picked file, uncropped, waiting on QrCropModal — kept
  // separate from qrDataUrl so a cancelled crop doesn't touch the card at
  // all, rather than needing to un-apply a preview that already rendered.
  const [qrCropSrc, setQrCropSrc] = useState<string | null>(null);
  // Cropped, waiting on a label before it's uploaded — a QR added from
  // here is saved to the account the same way as one added in Settings
  // (see ExpensesProvider's addPaymentQrCode), not just applied locally,
  // so it's there next time without re-uploading.
  const [pendingCrop, setPendingCrop] = useState<string | null>(null);
  const [savingQr, setSavingQr] = useState(false);
  const [rendering, setRendering] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const items = expense.items ?? [];
  const lines = splitLinesFor(person, items, split);
  const itemsSubtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const personSubtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const taxShare = expense.tax && itemsSubtotal > 0 ? expense.tax * (personSubtotal / itemsSubtotal) : 0;
  // The rounded, cent-reconciled figure the app already shows on-screen
  // (see computeSplitTotals in lib/expenses.ts) — used for the card's
  // Total so it never disagrees with what the person already saw in the
  // split UI, even though the per-line amounts above are the raw shares.
  const total = computeSplitTotals(items, expense.tax, split).get(person) ?? personSubtotal + taxShare;

  useEffect(() => {
    let cancelled = false;
    renderSplitShareCard({ expense, person, lines, taxShare, total, qrDataUrl })
      .then((canvas) => {
        if (cancelled) return;
        const target = canvasRef.current;
        if (!target) return;
        target.width = canvas.width;
        target.height = canvas.height;
        target.getContext("2d")!.drawImage(canvas, 0, 0);
        setRendering(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't generate the share image.");
          setRendering(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrDataUrl]);

  const handleQrChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setQrCropSrc(await fileToDataUrl(file));
    } catch {
      setError("Couldn't read that image.");
    }
  };

  const handleCropSave = (croppedDataUrl: string) => {
    setQrCropSrc(null);
    setPendingCrop(croppedDataUrl);
  };

  const handleConfirmUpload = async (label: string) => {
    if (!pendingCrop) return;
    setSavingQr(true);
    setError(undefined);
    try {
      const newQr = await addPaymentQrCode(pendingCrop, label);
      setPendingCrop(null);
      setRendering(true);
      setSelectedQrId(newQr.id);
      setQrDataUrl(newQr.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save QR code.");
    } finally {
      setSavingQr(false);
    }
  };

  const handleSelectSaved = (id: string, url: string) => {
    if (id === selectedQrId) return;
    setRendering(true);
    setSelectedQrId(id);
    setQrDataUrl(url);
  };

  const handleRemoveQr = () => {
    setRendering(true);
    setSelectedQrId(null);
    setQrDataUrl(null);
  };

  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError(undefined);
    try {
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], `${slug(expense.merchant)}-${slug(person)}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${expense.merchant} — ${person}'s share` });
        return;
      }
      // No Web Share support (most desktop browsers) — fall back to a
      // plain download so the button still does something useful rather
      // than silently failing.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // AbortError just means the user closed the native share sheet —
      // not a real failure, so it shouldn't show an error message.
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Couldn't share the image. Try downloading it instead.");
    }
  }, [expense.merchant, person]);

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError(undefined);
    try {
      const blob = await canvasToBlob(canvas);
      // ClipboardItem isn't in every browser (notably Firefox desktop, and
      // older Safari) — feature-detected rather than assumed, so those
      // browsers get a clear message pointing at Download instead of a
      // thrown error from calling something that doesn't exist.
      if (typeof ClipboardItem === "undefined") {
        setError("Copying images isn't supported in this browser. Try Download instead.");
        return;
      }
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy the image. Try Download instead.");
    }
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError(undefined);
    try {
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug(expense.merchant)}-${slug(person)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't download the image.");
    }
  };

  const atLimit = savedQrCodes.length >= MAX_PAYMENT_QR_CODES;

  return (
    <Modal title={`Share with ${person}`} onClose={onClose}>
      {error && <p className="mb-[8px] text-[12px] text-error">{error}</p>}

      <div className="flex max-h-[50vh] items-center justify-center overflow-y-auto rounded-md border border-hairline bg-canvas-soft p-[11px]">
        {rendering && <p className="py-[40px] text-[12px] text-ink-mute">Generating…</p>}
        <canvas ref={canvasRef} className={rendering ? "hidden" : "w-full max-w-[280px] rounded-sm"} />
      </div>

      <input ref={qrInputRef} type="file" accept="image/*" hidden onChange={handleQrChange} />

      <div className="mt-[11px] flex flex-wrap items-center gap-[8px]">
        {savedQrCodes.map((qr) => (
          <button
            key={qr.id}
            type="button"
            onClick={() => handleSelectSaved(qr.id, qr.url)}
            aria-pressed={selectedQrId === qr.id}
            title={qr.label}
            className={
              selectedQrId === qr.id
                ? "flex h-[37px] w-[37px] items-center justify-center overflow-hidden rounded-sm ring-2 ring-primary"
                : "flex h-[37px] w-[37px] items-center justify-center overflow-hidden rounded-sm border border-hairline-input opacity-60 transition-opacity hover:opacity-100"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.url} alt={qr.label} className="h-full w-full object-cover" />
          </button>
        ))}
        {!atLimit && (
          <button
            type="button"
            onClick={() => qrInputRef.current?.click()}
            aria-label="Upload and save a new payment QR code"
            title="Add a QR code"
            className="flex h-[37px] w-[37px] items-center justify-center rounded-sm border border-dashed border-hairline-input text-ink-mute transition-colors hover:bg-canvas-soft"
          >
            <QrCode size={15} weight="light" />
          </button>
        )}
        {qrDataUrl && (
          <button
            type="button"
            onClick={handleRemoveQr}
            aria-label="Don't include a QR code"
            title="No QR code"
            className="flex h-[37px] w-[37px] items-center justify-center rounded-sm border border-hairline-input text-ink-mute transition-colors hover:bg-canvas-soft"
          >
            <X size={14} weight="light" />
          </button>
        )}
      </div>

      <p className="mt-[6px] text-[11px] text-ink-mute">
        {selectedQrId
          ? `Using "${savedQrCodes.find((q) => q.id === selectedQrId)?.label}" — ${person} can scan it to pay you back straight from the image.`
          : savedQrCodes.length > 0
            ? `Pick a saved QR above, or add a new one — optional, adds a "Scan to pay" code to the bottom of the card.`
            : `Optional — adds a "Scan to pay" QR code (e.g. your bank/e-wallet QR) to the bottom of the card. Uploaded here, it's saved to your account (Settings → Payment QR codes) so you won't need to upload it again.`}
      </p>

      <div className="mt-[15px] flex items-center gap-[8px]">
        <button
          type="button"
          onClick={handleShare}
          disabled={rendering}
          className="flex h-[37px] flex-1 items-center justify-center gap-[6px] rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          <ShareNetwork size={15} weight="light" />
          Share image
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={rendering}
          className="flex h-[37px] items-center justify-center gap-[6px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft disabled:opacity-50"
        >
          {copied ? <Check size={15} weight="bold" /> : <Copy size={15} weight="light" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={rendering}
          className="flex h-[37px] items-center justify-center gap-[6px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft disabled:opacity-50"
        >
          <DownloadSimple size={15} weight="light" />
          Download
        </button>
      </div>
      {qrCropSrc && <QrCropModal imageSrc={qrCropSrc} onCancel={() => setQrCropSrc(null)} onSave={handleCropSave} />}
      {pendingCrop && (
        <LabelQrModal
          imageSrc={pendingCrop}
          defaultLabel={`QR ${savedQrCodes.length + 1}`}
          saving={savingQr}
          onCancel={() => setPendingCrop(null)}
          onSave={handleConfirmUpload}
        />
      )}
    </Modal>
  );
}
