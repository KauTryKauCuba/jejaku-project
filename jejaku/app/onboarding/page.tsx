import type { Metadata } from "next";
import { Suspense } from "react";
import FlowLines from "../components/FlowLines";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import OnboardingCard from "../components/OnboardingCard";

export const metadata: Metadata = {
  title: "Set up your profile — Jejaku",
  description: "Add your name and avatar to finish setting up your account.",
};

export default function OnboardingPage() {
  return (
    <>
      <div className="gradient-mesh">
        <div className="mesh-blob" aria-hidden="true" />
        <FlowLines />
        <SiteHeader />

        <section className="mx-auto max-w-6xl px-[23px] pt-[38px] pb-[91px] lg:pt-[61px]">
          <Suspense fallback={null}>
            <OnboardingCard />
          </Suspense>
        </section>
      </div>

      <SiteFooter />
    </>
  );
}
