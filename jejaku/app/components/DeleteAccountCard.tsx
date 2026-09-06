"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { WarningCircle } from "@phosphor-icons/react";
import { receiptUrl } from "../lib/receiptUrl";
import OtpInput from "./OtpInput";

const RESEND_COOLDOWN_SECONDS = 120;

const OTP_ERROR_MESSAGES: Record<string, string> = {
  otp_expired: "That code has expired. Request a new one.",
  otp_invalid: "That code isn't right. Try again.",
  otp_too_many_attempts: "Too many attempts. Request a new code.",
};

type Stage = "idle" | "confirming" | "otp";

export default function DeleteAccountCard({ email }: { email: string }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const reset = () => {
    setStage("idle");
    setCode("");
    setError(undefined);
    setSecondsLeft(0);
  };

  const requestCode = async () => {
    setSending(true);
    setError(undefined);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data.retryAfterSeconds === "number") setSecondsLeft(data.retryAfterSeconds);
        setError(data.error ?? "Couldn't send a code. Try again.");
        return;
      }
      setCode("");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setStage("otp");
    } catch {
      setError("Couldn't send a code. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(undefined);
    try {
      // Verifies the code and exchanges it for a short-lived signed token
      // (see lib/deleteToken.ts) that both delete calls below must present
      // — checked server-side by each of them, not just gated here on the
      // client, so a stolen/replayed session cookie alone can't trigger a
      // deletion without the emailed code ever being seen.
      const tokenRes = await fetch("/api/users/account/delete-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        setError(OTP_ERROR_MESSAGES[tokenData.error] ?? "Verification failed.");
        return;
      }
      const deleteToken = tokenData.token as string;

      // Receipt data lives in a fully separate database, so it's deleted
      // first via a credentialed cross-origin call while the shared
      // session cookie still identifies the account — if this fails, stop
      // here rather than deleting the identity that call depends on. Its
      // own DELETE route treats an already-deleted account as success, so
      // retrying this whole flow after a failure below is safe.
      const receiptRes = await fetch(receiptUrl("/api/users/account"), {
        method: "DELETE",
        credentials: "include",
        headers: { "X-Delete-Token": deleteToken },
      });
      if (!receiptRes.ok) throw new Error();

      const res = await fetch("/api/users/account", {
        method: "DELETE",
        headers: { "X-Delete-Token": deleteToken },
      });
      if (!res.ok) throw new Error();

      await signOut({ redirect: true, callbackUrl: "/" });
    } catch {
      setError("Couldn't delete your account. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-error/30 bg-canvas p-[24px]">
      <div className="flex items-center gap-[8px]">
        <WarningCircle size={16} weight="light" className="text-error" />
        <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">
          Danger zone
        </h3>
      </div>
      <p className="mt-[8px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        Permanently delete your account — including your profile and every receipt in
        Jejaku Receipt. This can&apos;t be undone.
      </p>

      {stage === "idle" && (
        <button
          type="button"
          onClick={() => setStage("confirming")}
          className="mt-[15px] flex h-[37px] w-fit items-center justify-center rounded-pill border border-error px-[19px] text-[14px] font-medium text-error transition-colors hover:bg-error/10"
        >
          Delete account
        </button>
      )}

      {stage === "confirming" && (
        <div className="mt-[15px] flex flex-col gap-[8px]">
          {error && <p className="text-[12px] text-error">{error}</p>}
          <p className="text-[12px] text-ink-mute">
            We&apos;ll send a verification code to <strong className="text-ink">{email}</strong> before
            deleting anything.
          </p>
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={requestCode}
              disabled={sending || secondsLeft > 0}
              className="flex h-[37px] items-center justify-center rounded-pill bg-error px-[19px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending…" : secondsLeft > 0 ? `Wait ${secondsLeft}s` : "Send verification code"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex h-[37px] items-center justify-center rounded-pill border border-hairline-input bg-canvas px-[19px] text-[14px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {stage === "otp" && (
        <div className="mt-[15px] flex flex-col gap-[8px]">
          <p className="text-[12px] text-ink-mute">
            Enter the 6-digit code sent to <strong className="text-ink">{email}</strong> to confirm
            deletion.
          </p>
          <OtpInput value={code} onChange={setCode} />
          {error && <p className="text-[12px] text-error">{error}</p>}
          <div className="text-[12px] text-ink-mute">
            {secondsLeft > 0 ? (
              <span>Resend code in {secondsLeft}s</span>
            ) : (
              <button type="button" disabled={sending} onClick={requestCode} className="text-primary disabled:opacity-50">
                {sending ? "Sending…" : "Resend code"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={handleDelete}
              disabled={code.length !== 6 || deleting}
              className="flex h-[37px] items-center justify-center rounded-pill bg-error px-[19px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete my account"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={deleting}
              className="flex h-[37px] items-center justify-center rounded-pill border border-hairline-input bg-canvas px-[19px] text-[14px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
