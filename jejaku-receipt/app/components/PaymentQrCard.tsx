"use client";

import { useRef, useState } from "react";
import { Plus, QrCode, Trash } from "@phosphor-icons/react";
import { MAX_PAYMENT_QR_CODES, type PaymentQrCode } from "../lib/paymentQr";
import { savePaymentQrCode } from "../lib/paymentQrClient";
import LabelQrModal from "./LabelQrModal";
import QrCropModal from "./QrCropModal";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function PaymentQrCard({ initialQrCodes }: { initialQrCodes: PaymentQrCode[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [qrCodes, setQrCodes] = useState(initialQrCodes);
  // Set once cropping finishes, waiting on a label before it's actually
  // uploaded — kept separate from qrCodes so a cancelled label step never
  // touches the saved list.
  const [pendingCrop, setPendingCrop] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const atLimit = qrCodes.length >= MAX_PAYMENT_QR_CODES;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setCropSrc(await fileToDataUrl(file));
    } catch {
      setError("Couldn't read that image.");
    }
  };

  const handleCropSave = (croppedDataUrl: string) => {
    setCropSrc(null);
    setPendingCrop(croppedDataUrl);
  };

  const handleConfirmUpload = async (label: string) => {
    if (!pendingCrop) return;
    setSaving(true);
    setError(undefined);
    try {
      const paymentQrCodes = await savePaymentQrCode(pendingCrop, label);
      setQrCodes(paymentQrCodes);
      setPendingCrop(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save QR code.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    setError(undefined);
    try {
      const res = await fetch(`/api/users/payment-qr?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't remove QR code.");
      const { paymentQrCodes } = (await res.json()) as { paymentQrCodes: PaymentQrCode[] };
      setQrCodes(paymentQrCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove QR code.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-[24px]">
      <div className="flex items-center gap-[8px]">
        <QrCode size={16} weight="light" className="text-primary" />
        <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">Payment QR codes</h3>
      </div>
      <p className="mt-[8px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        Save up to {MAX_PAYMENT_QR_CODES} (bank transfer, Touch &apos;n Go, DuitNow, ...) and pick whichever one fits
        when you share a split bill — no re-uploading each time.
      </p>
      {error && <p className="mt-[8px] text-[12px] text-error">{error}</p>}

      <div className="mt-[15px] flex flex-wrap gap-[11px]">
        {qrCodes.map((qr) => (
          <div key={qr.id} className="flex w-[84px] flex-col items-center gap-[6px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.url}
              alt={qr.label}
              className="h-[64px] w-[64px] rounded-sm border border-hairline object-cover"
            />
            <p className="w-full truncate text-center text-[11px] text-ink-mute" title={qr.label}>
              {qr.label}
            </p>
            <button
              type="button"
              onClick={() => handleRemove(qr.id)}
              disabled={removingId === qr.id}
              aria-label={`Remove ${qr.label}`}
              className="flex h-[24px] w-[24px] items-center justify-center rounded-pill text-error transition-colors hover:bg-canvas-soft disabled:opacity-50"
            >
              <Trash size={13} weight="light" />
            </button>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-[64px] w-[84px] flex-col items-center justify-center gap-[4px] rounded-sm border border-dashed border-hairline-input text-ink-mute transition-colors hover:bg-canvas-soft"
          >
            <Plus size={16} weight="light" />
            <span className="text-[11px]">Add QR</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />

      {cropSrc && <QrCropModal imageSrc={cropSrc} onCancel={() => setCropSrc(null)} onSave={handleCropSave} />}
      {pendingCrop && (
        <LabelQrModal
          imageSrc={pendingCrop}
          defaultLabel={`QR ${qrCodes.length + 1}`}
          saving={saving}
          onCancel={() => setPendingCrop(null)}
          onSave={handleConfirmUpload}
        />
      )}
    </div>
  );
}
