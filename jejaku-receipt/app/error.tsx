"use client";

import { useEffect } from "react";
import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas-soft px-[23px]">
      <div className="flex w-full max-w-[360px] flex-col items-center rounded-lg border border-hairline bg-canvas p-[30px] text-center">
        <WarningCircle size={26} weight="light" className="text-error" />
        <h1 className="mt-[15px] text-[16px] font-medium text-ink">Something went wrong</h1>
        <p className="mt-[6px] text-[13px] leading-relaxed text-ink-mute">
          That didn&apos;t load right. Nothing was lost — try again.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-[19px] flex h-[37px] items-center gap-[6px] rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
        >
          <ArrowClockwise size={14} weight="bold" />
          Try again
        </button>
      </div>
    </div>
  );
}
