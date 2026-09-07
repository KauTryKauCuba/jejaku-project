import { useEffect, useRef, type RefObject } from "react";

// Mount-order stack of every currently-open dismissable, shared across all
// hook instances — so Escape/outside-click only ever dismisses the
// topmost one. Without this, stacking dismissables would each register
// their own unconditional document-level listener, so one Escape press
// or one outside click fires every listener at once and closes the whole
// stack instead of just the top layer. (Ported from jejaku-receipt after
// hitting exactly this with nested modals there.)
const openStack: symbol[] = [];

export function useDismissable(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void
) {
  const idRef = useRef<symbol>(undefined);
  if (idRef.current === undefined) idRef.current = Symbol();

  useEffect(() => {
    if (!open) return;
    const id = idRef.current!;
    openStack.push(id);
    const isTopmost = () => openStack[openStack.length - 1] === id;

    const handlePointerDown = (e: MouseEvent) => {
      if (!isTopmost()) return;
      if (!ref.current?.contains(e.target as Node)) onDismiss();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopmost()) return;
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      const idx = openStack.indexOf(id);
      if (idx !== -1) openStack.splice(idx, 1);
    };
  }, [open, ref, onDismiss]);
}
