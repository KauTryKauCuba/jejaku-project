"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fingerprint } from "@phosphor-icons/react";
import OnboardingForm, { type OnboardingProfile } from "./OnboardingForm";
import MemberCard from "./MemberCard";
import { setStoredProfile, logAuditEvent } from "../lib/session";

export default function OnboardingCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? undefined;
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);

  if (profile) {
    return (
      <div className="mx-auto w-full max-w-[358px]">
        <div style={{ perspective: 1000 }}>
          <div className="card-tilt">
            <MemberCard profile={profile} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-[23px] flex h-[37px] w-full items-center justify-center rounded-pill bg-primary px-4 text-[16px] font-medium text-on-primary transition-transform active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[358px] rounded-lg border border-hairline bg-canvas p-[30px]">
      <p className="flex items-center gap-[6px] text-[12px] font-medium text-ink">
        <Fingerprint size={14} weight="light" />
        Almost there
      </p>
      <h1 className="mt-[19px] text-[19px] font-light tracking-[-0.19px] text-ink">
        Set up your profile
      </h1>
      <p className="mt-[8px] text-[14px] leading-relaxed text-ink-mute">
        Add your name and, if you&apos;d like, a photo.
      </p>

      <div className="mt-[23px]">
        <OnboardingForm
          email={email}
          onComplete={(completedProfile) => {
            setStoredProfile(completedProfile);
            logAuditEvent("account_created");
            setProfile(completedProfile);
          }}
        />
      </div>

      <p className="mt-[23px] text-[14px] leading-relaxed text-ink-mute">
        You can change this later.
      </p>
    </div>
  );
}
