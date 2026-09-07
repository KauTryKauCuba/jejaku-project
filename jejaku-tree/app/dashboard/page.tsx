import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hourglass } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser } from "../lib/currentUser";
import { jejakuUrl } from "../lib/jejakuUrl";
import DashboardShell from "../components/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard — Jejaku Tree",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(jejakuUrl("/login"));
  }

  return (
    <DashboardShell>
      <h2 className="text-[20px] font-light leading-[1.1] tracking-[-0.25px] text-ink">
        Welcome to Jejaku Tree
      </h2>
      <p className="mt-[6px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        You&apos;re signed in — this is just the boilerplate for now.
      </p>

      <div className="mt-[19px] flex min-h-[240px] flex-col items-center justify-center gap-[8px] rounded-lg border border-dashed border-hairline-input bg-canvas p-[24px] text-center">
        <Hourglass size={22} weight="light" className="text-ink-mute" />
        <p className="text-[14px] font-medium text-ink">Nothing here yet</p>
        <p className="max-w-sm text-[12px] leading-relaxed text-ink-mute">
          The family tree itself hasn&apos;t been built. Auth, the dashboard shell, and Settings already work —
          everything else starts from here.
        </p>
      </div>
    </DashboardShell>
  );
}
