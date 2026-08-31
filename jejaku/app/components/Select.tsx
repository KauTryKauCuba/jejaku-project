"use client";

import { useCallback, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { useDismissable } from "../lib/useDismissable";

export default function Select<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id?: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useDismissable(
    open,
    rootRef,
    useCallback(() => setOpen(false), [])
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-sm border border-hairline-input bg-canvas px-[11px] py-[8px] text-left text-[14px] text-ink outline-none transition-colors focus:border-primary"
      >
        {value}
        <CaretDown size={12} weight="bold" className="shrink-0 text-ink-mute" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-[240px] overflow-auto rounded-sm border border-hairline bg-canvas py-[4px] shadow-lg"
        >
          {options.map((option) => {
            const selected = option === value;
            return (
              <li key={option} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={
                    selected
                      ? "flex w-full items-center justify-between gap-[8px] bg-primary-subdued px-[11px] py-[8px] text-left text-[14px] font-medium text-primary-deep"
                      : "flex w-full items-center justify-between gap-[8px] px-[11px] py-[8px] text-left text-[14px] text-ink transition-colors hover:bg-canvas-soft"
                  }
                >
                  {option}
                  {selected && <Check size={13} weight="bold" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
