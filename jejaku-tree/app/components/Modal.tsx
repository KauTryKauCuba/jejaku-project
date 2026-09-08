"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { useDismissable } from "../lib/useDismissable";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDismissable(true, panelRef, useCallback(() => onClose(), [onClose]));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-[15px] py-[38px]">
      <div
        ref={panelRef}
        className="w-full max-w-[480px] rounded-lg border border-hairline bg-canvas p-[20px] shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-[28px] w-[28px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
          >
            <X size={14} weight="light" />
          </button>
        </div>
        <div className="mt-[15px]">{children}</div>
      </div>
    </div>
  );
}
