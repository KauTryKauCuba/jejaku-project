import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";
import FlowLines from "../components/FlowLines";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SettingsForm from "../components/SettingsForm";
import DefaultCurrencyForm from "../components/DefaultCurrencyForm";

export const metadata: Metadata = {
  title: "Settings — Jejaku",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.otpConfirmed || !session.dbProfile) {
    redirect("/");
  }

  return (
    <>
      <div className="relative">
        {/* Background layer is a sibling of the header/hero content below,
            not their parent — gradient-mesh clips overflow, which would
            cut off the UserBadge popover (Settings/Log out) if it were a
            descendant. Same rule already applied below for the currency
            dropdown cards, documented in DESIGN.md. */}
        <div className="gradient-mesh" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          <div className="mesh-blob" aria-hidden="true" />
          <FlowLines />
        </div>

        <div className="relative">
          <SiteHeader />

          <section className="mx-auto max-w-4xl px-[23px] pt-[38px] pb-[46px] lg:pt-[61px]">
            <h1 className="text-[38px] font-light leading-[1.05] tracking-[-1.14px] text-ink md:text-[46px]">
              Settings
            </h1>
            <p className="mt-[19px] max-w-[52ch] text-[16px] leading-relaxed text-ink-secondary">
              Your name and photo here are shared across Jejaku and Jejaku Receipt.
            </p>
          </section>
        </div>
      </div>

      {/* Cards live outside .gradient-mesh, not just below its content —
          the mesh box clips overflow, so a popover deep inside it (the
          currency dropdown) got cut off at the mesh box's bottom edge
          instead of overlaying the page. Same rule as the Dashboard Shell
          navbar popover, documented in DESIGN.md. */}
      <section className="bg-canvas pb-[91px]">
        <div className="mx-auto max-w-4xl px-[23px]">
          <div className="mt-[38px]">
            <SettingsForm profile={session.dbProfile} />
          </div>

          <div className="mt-[19px] rounded-lg border border-hairline bg-canvas p-[24px]">
            <DefaultCurrencyForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
