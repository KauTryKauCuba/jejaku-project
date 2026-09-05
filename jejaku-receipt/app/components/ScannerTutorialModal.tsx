"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "@phosphor-icons/react";
import Modal from "./Modal";
import ScanStepIllustration from "./ScanStepIllustration";
import SplitStepIllustration from "./SplitStepIllustration";

const TUTORIALS = {
  scan: {
    title: "How Quick Scan works",
    Illustration: ScanStepIllustration,
    steps: [
      {
        title: "Frame the receipt",
        body: "Lay it flat, keep the whole receipt in frame, and make sure it's well lit before you tap the shutter.",
        note: "Already have a photo? Import photo runs the same read without opening the camera.",
      },
      {
        title: "The scan reads it",
        body: "The photo goes to the scanner, which pulls out the merchant, amount, date, line items, tax, and currency.",
      },
      {
        title: "Check the details",
        body: "The form comes back pre-filled. Fix anything the scan got wrong or missed — it says so when it wasn't confident.",
      },
      {
        title: "Save it",
        body: "The receipt and its photo are saved to your account, and it lands at the top of your receipts list.",
      },
    ],
  },
  split: {
    title: "How Quick Split works",
    Illustration: SplitStepIllustration,
    steps: [
      {
        title: "Pick a receipt",
        body: "Quick Split works on a receipt you've already saved. Only receipts with an itemized list can be split.",
        note: "No items on the one you want? Edit it from the Receipts page and add them first.",
      },
      {
        title: "Add the people",
        body: "Type in everyone sharing the bill. They become tags you'll assign items to on the next step.",
      },
      {
        title: "Tag who had what",
        body: "For each item, tap the people who shared it. An item split two ways costs each of them half.",
      },
      {
        title: "Tax follows the order",
        body: "Tax is divided in proportion to what each person actually ordered, not evenly — so the bigger order carries more of it.",
      },
      {
        title: "Save the split",
        body: "The split is stored on the receipt, which keeps its own total and details, and the list shows how many ways it went.",
      },
    ],
  },
} as const;

export type TutorialKind = keyof typeof TUTORIALS;

export default function ScannerTutorialModal({
  kind,
  onContinue,
  onClose,
}: {
  kind: TutorialKind;
  onContinue: (dontShowAgain: boolean) => void;
  onClose: () => void;
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [step, setStep] = useState(0);

  const { title, Illustration, steps } = TUTORIALS[kind];
  const current = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex items-center gap-[5px]" aria-hidden="true">
        {steps.map((s, i) => (
          <span
            key={s.title}
            className={
              i === step
                ? "h-[4px] w-[18px] rounded-pill bg-primary transition-all"
                : "h-[4px] w-[4px] rounded-pill bg-hairline transition-all"
            }
          />
        ))}
      </div>

      {/* Remounting on `key` replays the CSS entry animation — same trick
          (and same keyframe, reduced-motion guard included) as the tabs on
          the marketing page. */}
      <div
        key={step}
        role="group"
        aria-label={`Step ${step + 1} of ${steps.length}`}
        className="mt-[15px] animate-[tab-fade-in_0.25s_ease-out]"
      >
        <div className="flex h-[140px] w-full items-center justify-center overflow-hidden rounded-md bg-canvas-soft">
          <Illustration step={step} />
        </div>
        {/* Floor sized to the tallest step (the ones carrying a note) so the
            modal doesn't resize under the buttons on every Next. */}
        <div className="mt-[11px] min-h-[74px]">
          <p className="text-[13px] font-medium text-ink">{current.title}</p>
          <p className="mt-[4px] text-[12px] leading-relaxed text-ink-mute">{current.body}</p>
          {"note" in current && (
            <p className="mt-[6px] text-[11px] leading-relaxed text-ink-mute">{current.note}</p>
          )}
        </div>
      </div>

      {isLastStep && (
        <label className="mt-[15px] flex items-center gap-[8px] text-[12px] text-ink-mute">
          <button
            type="button"
            role="checkbox"
            aria-checked={dontShowAgain}
            onClick={() => setDontShowAgain((v) => !v)}
            className={
              dontShowAgain
                ? "flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] bg-primary text-on-primary"
                : "flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border border-hairline-input"
            }
          >
            {dontShowAgain && <Check size={11} weight="bold" />}
          </button>
          Don&apos;t show this again
        </label>
      )}

      <div className="mt-[15px] flex items-center gap-[8px]">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          aria-label="Previous step"
          className="flex h-[37px] w-[37px] shrink-0 items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft disabled:opacity-40 disabled:hover:bg-canvas"
        >
          <ArrowLeft size={14} weight="light" />
        </button>
        <button
          type="button"
          onClick={() => (isLastStep ? onContinue(dontShowAgain) : setStep((s) => s + 1))}
          className="flex h-[37px] flex-1 items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
        >
          {isLastStep ? "Continue" : "Next"}
        </button>
      </div>
    </Modal>
  );
}
