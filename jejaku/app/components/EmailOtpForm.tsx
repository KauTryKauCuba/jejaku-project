"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "./FormField";
import OtpInput from "./OtpInput";
import { setStoredProfile } from "../lib/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 120;

class OtpRequestError extends Error {
  cooldown: boolean;
  constructor(message: string, cooldown = false) {
    super(message);
    this.cooldown = cooldown;
  }
}

export type VerifiedProfile = { fullName: string; avatarUrl?: string };

export default function EmailOtpForm({
  size = "default",
  initialEmail,
  onVerified,
  onCancel,
}: {
  size?: "default" | "compact";
  /** Skips the email step and auto-sends a code to this address (e.g. after Google sign-in). */
  initialEmail?: string;
  /** Called instead of the default onboarding/dashboard redirect once the code is verified. `profile` is the existing account for this email, if any. */
  onVerified?: (email: string, profile: VerifiedProfile | null) => void;
  /** Replaces "Use a different email" with "Cancel" when set (verification mode). */
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">(initialEmail ? "otp" : "email");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const requestOtp = async () => {
    const res = await fetch("/api/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (typeof data.retryAfterSeconds === "number") {
        setSecondsLeft(data.retryAfterSeconds);
        throw new OtpRequestError(data.error ?? "Couldn't send a code. Try again.", true);
      }
      throw new OtpRequestError(data.error ?? "Couldn't send a code. Try again.");
    }
  };

  useEffect(() => {
    if (!initialEmail || autoSentRef.current) return;
    autoSentRef.current = true;
    requestOtp()
      .then(() => setSecondsLeft(RESEND_COOLDOWN_SECONDS))
      .catch((err) => {
        if (err instanceof OtpRequestError && err.cooldown) {
          setCooldownActive(true);
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
        }
      });
    // Only fires once on mount for the auto-sent code; requestOtp reads the latest `email` via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmail]);

  const cooldownMessage =
    cooldownActive && secondsLeft > 0
      ? `Please wait ${secondsLeft}s before requesting another code.`
      : undefined;

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
        <OtpInput value={code} onChange={setCode} />
        {error && <p className="text-[12px] text-error">{error}</p>}
        <div className={size === "compact" ? "text-[13px] text-ink-mute" : "text-[14px] text-ink-mute"}>
          {secondsLeft > 0 ? (
            <span>Resend code in {secondsLeft}s</span>
          ) : (
            <button
              type="button"
              disabled={resending}
              onClick={async () => {
                setResending(true);
                setError(undefined);
                try {
                  await requestOtp();
                  setCode("");
                  setSecondsLeft(RESEND_COOLDOWN_SECONDS);
                  setCooldownActive(false);
                } catch (err) {
                  if (err instanceof OtpRequestError && err.cooldown) {
                    setCooldownActive(true);
                  } else {
                    setCooldownActive(false);
                    setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
                  }
                } finally {
                  setResending(false);
                }
              }}
              className="text-primary disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>
        <button
          type="button"
          disabled={code.length !== 6 || submitting}
          onClick={async () => {
            setSubmitting(true);
            setError(undefined);
            try {
              const res = await fetch("/api/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
              });
              const data = await res.json();
              if (!res.ok) {
                setError(data.error ?? "Verification failed.");
                return;
              }
              const profile: VerifiedProfile | null = data.profile ?? null;
              if (onVerified) {
                onVerified(email, profile);
              } else if (profile) {
                setStoredProfile({
                  fullName: profile.fullName,
                  avatarUrl: profile.avatarUrl,
                  email,
                  registeredAt: new Date().toISOString(),
                });
                router.push("/dashboard");
              } else {
                router.push(`/onboarding?email=${encodeURIComponent(email)}`);
              }
            } catch {
              setError("Something went wrong. Try again.");
            } finally {
              setSubmitting(false);
            }
          }}
          className={`${topMargin} flex items-center justify-center rounded-pill bg-primary font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50 ${buttonPad}`}
        >
          {submitting ? "Verifying…" : "Continue"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (onCancel) {
              onCancel();
              return;
            }
            setStep("email");
            setCode("");
            setError(undefined);
            setCooldownActive(false);
            setSecondsLeft(0);
          }}
          className={size === "compact" ? "text-[13px] text-ink-mute" : "text-[14px] text-ink-mute"}
        >
          {onCancel ? "Cancel" : "Use a different email"}
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className={`flex flex-col ${gap}`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!EMAIL_PATTERN.test(email)) {
          setError("Enter a valid email address.");
          return;
        }
        setError(undefined);
        setSubmitting(true);
        try {
          await requestOtp();
          setCode("");
          setSecondsLeft(RESEND_COOLDOWN_SECONDS);
          setCooldownActive(false);
          setStep("otp");
        } catch (err) {
          if (err instanceof OtpRequestError && err.cooldown) {
            setCooldownActive(true);
          } else {
            setCooldownActive(false);
            setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
          }
        } finally {
          setSubmitting(false);
        }
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
          if (cooldownActive) setCooldownActive(false);
        }}
        error={cooldownMessage ?? error}
      />
      <button
        type="submit"
        disabled={submitting || (cooldownActive && secondsLeft > 0)}
        className={`${topMargin} rounded-pill bg-primary font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50 ${buttonPad}`}
      >
        {submitting ? "Sending…" : "Continue with email"}
      </button>
    </form>
  );
}
