"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "./FormField";
import OtpInput from "./OtpInput";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailOtpForm({
  size = "default",
}: {
  size?: "default" | "compact";
}) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const gap = size === "compact" ? "gap-[15px]" : "gap-5";
  const buttonPad =
    size === "compact"
      ? "h-[37px] px-[15px] text-[14px]"
      : "h-[37px] px-4 text-[16px]";
  const topMargin = size === "compact" ? "mt-[4px]" : "mt-2";

  if (step === "otp") {
    return (
      <div className={`flex flex-col ${gap}`}>
        <p className={size === "compact" ? "text-[13px] text-ink-mute" : "text-[14px] text-ink-mute"}>
          Enter the 6-digit code sent to <strong className="text-ink">{email}</strong>.
        </p>
        <OtpInput />
        <button
          type="button"
          onClick={() =>
            router.push(`/onboarding?email=${encodeURIComponent(email)}`)
          }
          className={`${topMargin} flex items-center justify-center rounded-pill bg-primary font-medium text-on-primary transition-transform active:scale-[0.98] ${buttonPad}`}
        >
          Continue
        </button>
        <button
          type="button"
          onClick={() => setStep("email")}
          className={size === "compact" ? "text-[13px] text-ink-mute" : "text-[14px] text-ink-mute"}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className={`flex flex-col ${gap}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!EMAIL_PATTERN.test(email)) {
          setError("Enter a valid email address.");
          return;
        }
        setError(undefined);
        setStep("otp");
      }}
    >
      <FormField
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(value) => {
          setEmail(value);
          if (error) setError(undefined);
        }}
        error={error}
      />
      <button
        type="submit"
        className={`${topMargin} rounded-pill bg-primary font-medium text-on-primary transition-transform active:scale-[0.98] ${buttonPad}`}
      >
        Continue with email
      </button>
    </form>
  );
}
