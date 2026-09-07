"use client";

import HeroAuthCard from "./HeroAuthCard";
import FlowLines from "./FlowLines";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

// Deliberately just a hero + sign-in card — no projects list here (unlike
// jejaku-receipt's copy of this file, which lists jejaku's other apps).
// That content only makes sense on jejaku's own homepage; this app has
// nothing of its own to list yet.
export default function HomeContent() {
  return (
    <>
      <div className="gradient-mesh">
        <div className="mesh-blob" aria-hidden="true" />
        <FlowLines />
        <SiteHeader />

        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-[46px] px-[23px] pt-[38px] pb-[91px] lg:grid-cols-2 lg:gap-[61px] lg:pt-[61px]">
          <div>
            <h1 className="text-[38px] font-light leading-[1.05] tracking-[-1.14px] text-ink md:text-[53px] md:tracking-[-1.33px]">
              A family tree
              <br />
              you actually add to
            </h1>
            <p className="mt-[23px] max-w-[46ch] text-[16px] leading-relaxed text-ink-secondary">
              Parents, siblings, kids, grandparents — one relative at a time. Still early: the account and
              sign-in work, the tree itself is still being built.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroAuthCard />
          </div>
        </section>
      </div>

      <SiteFooter />
    </>
  );
}
