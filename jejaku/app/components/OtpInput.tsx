"use client";

import { useRef, type MutableRefObject } from "react";

export default function OtpInput({
  value,
  onChange,
  onDigitEntered,
  boxRefs,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Fired with the exact box index and digit whenever a single digit is
   *  typed (not on backspace/paste) — lets a parent trigger a per-box effect
   *  (e.g. DigitGlobe's fly-in animation) without re-deriving it from a diff
   *  of the whole value string. */
  onDigitEntered?: (index: number, digit: string) => void;
  /** Lets a parent read each box's live DOM position (getBoundingClientRect)
   *  for that same kind of effect — populated alongside the internal ref
   *  used for focus management, not instead of it. */
  boxRefs?: MutableRefObject<(HTMLInputElement | null)[]>;
}) {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(""));
    if (digit) {
      onDigitEntered?.(index, digit);
      if (index < 5) inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    onChange(next.join(""));
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-[8px]" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
            if (boxRefs) boxRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="tabular h-[46px] w-[15%] min-w-0 rounded-sm border border-hairline-input bg-canvas text-center text-[18px] text-ink outline-none transition-colors focus:border-primary"
        />
      ))}
    </div>
  );
}
