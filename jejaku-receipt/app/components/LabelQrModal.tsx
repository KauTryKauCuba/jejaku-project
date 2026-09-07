"use client";

import { useState } from "react";

// A lightweight step between cropping a QR and actually saving it — shown
// by both PaymentQrCard (Settings) and ShareSplitModal, since a QR
// uploaded from either place is now saved to the account the same way
// (see lib/paymentQrClient.ts) and needs a label either way.
export default function LabelQrModal({
  imageSrc,
  defaultLabel,
  saving,
  onCancel,
  onSave,
}: {
  imageSrc: string;
  defaultLabel: string;
  saving: boolean;
  onCancel: () => void;
  onSave: (label: string) => void;
}) {
  const [label, setLabel] = useState(defaultLabel);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-[15px] py-[38px]">
      <div className="w-full max-w-[360px] rounded-lg border border-hairline bg-canvas p-[20px] shadow-lg">
        <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">Name this QR code</h3>
        <p className="mt-[4px] text-[12px] text-ink-mute">
          Saved to your account (Settings → Payment QR codes) so you can pick it again next time — e.g. &quot;Bank
          transfer&quot; or &quot;Touch &apos;n Go&quot;.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt="QR preview" className="mx-auto mt-[15px] h-[96px] w-[96px] rounded-sm border border-hairline object-cover" />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={40}
          autoFocus
          className="mt-[15px] h-[37px] w-full rounded-sm border border-hairline-input bg-canvas px-[11px] text-[14px] text-ink focus:border-primary focus:outline-none"
        />
        <div className="mt-[15px] flex items-center gap-[8px]">
          <button
            type="button"
            onClick={() => onSave(label)}
            disabled={saving}
            className="flex h-[37px] flex-1 items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex h-[37px] items-center justify-center rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
