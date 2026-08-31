import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";
import { jejakuUrl } from "../lib/jejakuUrl";
import DashboardShell from "../components/DashboardShell";
import MemberCard from "../components/MemberCard";

export const metadata: Metadata = {
  title: "Settings — Jejaku Receipt",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.otpConfirmed || !session.dbProfile) {
    redirect(jejakuUrl("/login"));
  }

  return (
    <DashboardShell>
      <h2 className="text-[20px] font-light leading-[1.1] tracking-[-0.25px] text-ink">
        Settings
      </h2>
      <p className="mt-[6px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        Your profile is shared with Jejaku — edit your name and photo there.
      </p>

      <div className="mt-[19px] grid gap-[19px] md:grid-cols-[280px_1fr]">
        <div style={{ perspective: 1000 }}>
          <MemberCard profile={session.dbProfile} />
        </div>

        <div className="rounded-lg border border-hairline bg-canvas p-[24px]">
          <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">
            Edit profile
          </h3>
          <p className="mt-[4px] max-w-md text-[12px] leading-relaxed text-ink-mute">
            Your name and photo are managed on Jejaku and shared here automatically.
          </p>
          <a
            href={jejakuUrl("/settings")}
            className="mt-[15px] flex h-[37px] w-fit items-center justify-center rounded-pill bg-primary px-[19px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
          >
            Manage profile on Jejaku
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}
