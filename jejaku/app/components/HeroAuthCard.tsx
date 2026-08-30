"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Fingerprint } from "@phosphor-icons/react";
import GoogleButton from "./GoogleButton";
import EmailOtpForm from "./EmailOtpForm";
import { setStoredProfile, useStoredProfile } from "../lib/session";

export default function HeroAuthCard() {
  const { data: session, status } = useSession();
  const profile = useStoredProfile();
  const router = useRouter();

  const email = session?.user?.email;
  const needsVerification =
    status === "authenticated" && !!email && profile?.email !== email;

  if (needsVerification) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-[23px] text-left sm:p-[30px]">
        <p className="flex items-center gap-[6px] text-[12px] font-medium text-primary-deep">
          <Fingerprint size={15} weight="light" />
          One last step
        </p>
        <p className="mt-[8px] text-[13px] leading-relaxed text-ink-mute">
          Confirm your Google account with a quick code by email.
        </p>

        <div className="mt-[15px]">
          <EmailOtpForm
            size="compact"
            initialEmail={email}
            onVerified={() => {
              setStoredProfile({
                fullName: session!.user!.name ?? email,
                avatarUrl: session!.user!.image ?? undefined,
                email,
                registeredAt: new Date().toISOString(),
              });
              router.push("/dashboard");
            }}
            onCancel={() => {
              signOut({ redirect: false });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-[23px] text-left sm:p-[30px]">
      <p className="flex items-center gap-[6px] text-[12px] font-medium text-primary-deep">
        <Fingerprint size={15} weight="light" />
        One account, every project
      </p>
      <p className="mt-[8px] text-[13px] leading-relaxed text-ink-mute">
        No password — just a quick code by email.
      </p>

      <div className="mt-[15px]">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="mt-[15px] flex items-center gap-[11px]">
        <div className="h-px flex-1 bg-hairline" />
        <span className="text-[12px] text-ink-mute">or</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <div className="mt-[15px]">
        <EmailOtpForm size="compact" />
      </div>
    </div>
  );
}
