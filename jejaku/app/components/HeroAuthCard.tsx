"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Fingerprint } from "@phosphor-icons/react";
import GoogleButton from "./GoogleButton";
import GithubButton from "./GithubButton";
import DiscordButton from "./DiscordButton";
import EmailOtpForm from "./EmailOtpForm";

export default function HeroAuthCard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const email = session?.user?.email;
  const needsVerification = status === "authenticated" && !!email && !session?.otpConfirmed;

  if (needsVerification) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-[23px] text-left sm:p-[30px]">
        <p className="flex items-center gap-[6px] text-[12px] font-medium text-primary-deep">
          <Fingerprint size={15} weight="light" />
          One last step
        </p>
        <p className="mt-[8px] text-[13px] leading-relaxed text-ink-mute">
          Confirm your account with a quick code by email.
        </p>

        <div className="mt-[15px]">
          <EmailOtpForm
            size="compact"
            initialEmail={email}
            onVerified={(verifiedEmail, profile) => {
              if (profile) {
                router.push("/dashboard");
                return;
              }
              const params = new URLSearchParams({ email: verifiedEmail });
              if (session!.user!.name) params.set("name", session!.user!.name);
              if (session!.user!.image) params.set("avatar", session!.user!.image);
              router.push(`/onboarding?${params.toString()}`);
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

      <div className="mt-[15px] flex flex-col gap-[8px]">
        <GoogleButton label="Continue with Google" />
        <GithubButton label="Continue with GitHub" />
        <DiscordButton label="Continue with Discord" />
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
