import Image from "next/image";
import { getInitials } from "../lib/initials";
import { formatIsoMinute } from "../lib/formatIso";
import type { OnboardingProfile } from "./OnboardingForm";

export default function MemberCard({
  profile,
}: {
  profile: OnboardingProfile;
}) {
  const formatDateTime = (iso: string) => formatIsoMinute(new Date(iso));

  const registered = formatDateTime(profile.registeredAt);
  const lastSignIn = profile.lastSignInAt ? formatDateTime(profile.lastSignInAt) : "First visit";

  return (
    <div
      className="card-reveal relative flex aspect-[1.586/1] w-full flex-col overflow-hidden rounded-xl border border-hairline p-[23px] text-ink"
      style={{
        background:
          "linear-gradient(135deg, #f6f7f7 0%, #ffffff 30%, #dadde0 58%, #f1f2f3 80%, #e4e7e8 100%)",
      }}
    >
      <div
        className="card-holo pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, #ff2f92 0%, #ffb020 12%, #6dff4d 24%, #22c9ff 36%, #a83bff 48%, #ff2f92 60%)",
          opacity: 0.8,
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 85% 15%, rgba(255,255,255,0.7), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between">
        <span className="flex items-center gap-[6px]">
          <Image src="/jk-logo.svg" alt="" width={18} height={18} />
          <span className="text-[13px] font-semibold tracking-tight text-primary-soft">
            jejaku
          </span>
        </span>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-canvas-soft">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[17px] font-medium text-primary-deep">
              {getInitials(profile.fullName)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-[1]" aria-hidden="true" />

      <div className="relative">
        <p className="text-[19px] font-light leading-tight tracking-[0.4px] text-ink">
          {profile.fullName}
        </p>
        <p className="mt-0 truncate text-[13px] leading-tight text-ink-secondary">
          {profile.email ?? "—"}
        </p>
      </div>

      <div className="flex-[3]" aria-hidden="true" />

      <div className="relative flex items-end justify-between gap-[10px] text-[11px]">
        <div className="min-w-0 text-left">
          <p className="uppercase tracking-[1px] text-ink-mute">
            Member since
          </p>
          <p className="tabular mt-[2px] text-ink-secondary">{registered}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="uppercase tracking-[1px] text-ink-mute">
            Last login
          </p>
          <p className="tabular mt-[2px] text-ink-secondary">{lastSignIn}</p>
        </div>
      </div>
    </div>
  );
}
