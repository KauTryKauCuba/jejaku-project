"use client";

import { useCallback, useRef, useState } from "react";
import { CaretDown, Check, Plus } from "@phosphor-icons/react";
import { useDismissable } from "../lib/useDismissable";

export default function Select<T extends string>({
  id,
  value,
  options,
  onChange,
  onCreate,
  createLabel = "Add new",
}: {
  id?: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  /** When provided, shows an inline "+ Add new" row at the bottom of the list
   * that lets the user type and submit a new option. */
  onCreate?: (value: string) => Promise<void> | void;
  createLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [createError, setCreateError] = useState<string | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);

  useDismissable(
    open,
    rootRef,
    useCallback(() => {
      setOpen(false);
      setCreating(false);
      setNewValue("");
      setCreateError(undefined);
    }, [])
  );

  const handleCreateSubmit = async () => {
    const trimmed = newValue.trim();
    if (!trimmed || !onCreate) return;
    setCreateError(undefined);
    try {
      await onCreate(trimmed);
      onChange(trimmed as T);
      setCreating(false);
      setNewValue("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Couldn't add that.");
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[37px] w-full items-center justify-between rounded-sm border border-hairline-input bg-canvas px-[11px] text-left text-[14px] text-ink outline-none transition-colors focus:border-primary"
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
          {onCreate && (
            <li className="border-t border-hairline">
              {creating ? (
                <div className="flex flex-col gap-[6px] px-[11px] py-[8px]">
                  <div className="flex items-center gap-[6px]">
                    <input
                      autoFocus
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateSubmit();
                        }
                      }}
                      placeholder="New category"
                      className="min-w-0 flex-1 rounded-sm border border-hairline-input bg-canvas px-[8px] py-[5px] text-[13px] text-ink outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleCreateSubmit}
                      className="shrink-0 rounded-sm bg-primary px-[9px] py-[5px] text-[12px] font-medium text-on-primary"
                    >
                      Add
                    </button>
                  </div>
                  {createError && <p className="text-[11px] text-error">{createError}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-[6px] px-[11px] py-[8px] text-left text-[14px] text-ink-mute transition-colors hover:bg-canvas-soft"
                >
                  <Plus size={13} weight="bold" />
                  {createLabel}
                </button>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
