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
      <div className="relative">
        {/* Background layer is a sibling of the header/hero content below,
            not their parent — gradient-mesh clips overflow, which would
            cut off the UserBadge popover (Settings/Log out) if it were a
            descendant. Same rule as the Dashboard Shell navbar, documented
            in DESIGN.md. */}
        <div className="gradient-mesh" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          <div className="mesh-blob" aria-hidden="true" />
          <FlowLines />
        </div>

        <div className="relative">
          <SiteHeader />

          <section className="mx-auto max-w-6xl px-[23px] pt-[38px] pb-[91px] lg:pt-[61px]">
            <Suspense fallback={null}>
              <OnboardingCard />
            </Suspense>
          </section>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
