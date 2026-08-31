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
      <div className="gradient-mesh">
        <div className="mesh-blob" aria-hidden="true" />
        <FlowLines />
        <SiteHeader />

        <section className="mx-auto max-w-4xl px-[23px] pt-[38px] pb-[91px] lg:pt-[61px]">
          <h1 className="text-[38px] font-light leading-[1.05] tracking-[-1.14px] text-ink md:text-[46px]">
            Settings
          </h1>
          <p className="mt-[19px] max-w-[52ch] text-[16px] leading-relaxed text-ink-secondary">
            Your name and photo here are shared across Jejaku and Jejaku Receipt.
          </p>

          <div className="mt-[38px]">
            <SettingsForm profile={session.dbProfile} />
          </div>

          <div className="mt-[19px] rounded-lg border border-hairline bg-canvas p-[24px]">
            <DefaultCurrencyForm />
          </div>
        </section>
      </div>
      <SiteFooter />
    </>
  );
}
