"use client";

import { useEffect, useState } from "react";

export type Flight = {
  id: number;
  digit: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

// A single digit's flight from wherever it was picked off DigitGlobe to the
// OtpInput box it landed in — position: fixed (viewport coordinates, same
// space getBoundingClientRect already gave us) with a two-phase mount: the
// first render places it at `from` with no transition yet, then next frame
// flips both the translate and the transition on together, so the browser
// actually animates the move instead of snapping straight to `to`.
export default function FlyingDigit({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setArrived(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const pos = arrived ? flight.to : flight.from;

  return (
    <span
      aria-hidden="true"
      onTransitionEnd={onDone}
      className="tabular pointer-events-none fixed left-0 top-0 z-50 text-[18px] font-medium text-primary"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) scale(${arrived ? 1 : 1.6})`,
        opacity: arrived ? 0 : 1,
        transition: "transform 480ms cubic-bezier(0.3, 0.7, 0.2, 1), opacity 480ms ease-in",
      }}
    >
      {flight.digit}
    </span>
  );
}
