"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WarningCircle } from "@phosphor-icons/react";

export default function DangerZoneCard({ expenseCount }: { expenseCount: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleDelete = async () => {
    setDeleting(true);
    setError(undefined);
    try {
      const res = await fetch("/api/expenses", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setConfirming(false);
      setConfirmText("");
      router.refresh();
    } catch {
      setError("Couldn't delete your expenses. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-error/30 bg-canvas p-[24px]">
      <div className="flex items-center gap-[8px]">
        <WarningCircle size={16} weight="light" className="text-error" />
        <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">
          Danger zone
        </h3>
      </div>
      <p className="mt-[8px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        Permanently delete every expense on your account ({expenseCount} total) —
        including their receipt photos. This can&apos;t be undone.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={expenseCount === 0}
          className="mt-[15px] flex h-[37px] w-fit items-center justify-center rounded-pill border border-error px-[19px] text-[14px] font-medium text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete all expenses
        </button>
      ) : (
        <div className="mt-[15px] flex flex-col gap-[8px]">
          {error && <p className="text-[12px] text-error">{error}</p>}
          <label className="text-[12px] text-ink-mute">
            Type <span className="font-medium text-ink">DELETE</span> to confirm.
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="h-[37px] w-[160px] rounded-sm border border-hairline-input bg-canvas px-[11px] text-[14px] text-ink outline-none focus:border-error"
          />
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || deleting}
              className="flex h-[37px] items-center justify-center rounded-pill bg-error px-[19px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete everything"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setConfirmText("");
                setError(undefined);
              }}
              disabled={deleting}
              className="flex h-[37px] items-center justify-center rounded-pill border border-hairline-input bg-canvas px-[19px] text-[14px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
