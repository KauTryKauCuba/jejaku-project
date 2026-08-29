import type { Metadata } from "next";
import FlowLines from "../components/FlowLines";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Roadmap — Jejaku",
  description: "What's shipped, what's in progress, and what's planned next.",
};

const TIMELINE = [
  {
    status: "Jejaku Beta v0.0.1",
    title: "Building Jejaku",
    body: "This site itself — still shaping the pages, the auth flow, and everything else here.",
    dateLabel: "Started",
    date: "Wednesday, August 26, 2026, 10:54 PM",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Polishing Jejaku",
    body: "Ongoing tweaks to the design system, the onboarding flow, and the landing page content — refining what's already here before starting on anything new. Jejaku Receipt waits until this feels right, not perfect.",
    dateLabel: "Started",
    date: "Thursday, August 27, 2026, 6:32 PM",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Accounts, onboarding & dashboard",
    body: "Email sign-in, a profile setup step with an avatar and a holographic member card, and a signed-in dashboard at its own URL that swaps in automatically once you're set up.",
    dateLabel: "Shipped",
    date: "Friday, August 28, 2026",
  },
  {
    status: "Up next",
    title: "Jejaku Receipt",
    body: "Once Jejaku itself is settled, this moves from experiment to a real project on the site — auth-gated, and open for anyone to try.",
  },
];

export default function RoadmapPage() {
  return (
    <>
      <div className="gradient-mesh">
        <div className="mesh-blob" aria-hidden="true" />
        <FlowLines />
        <SiteHeader />

        <section className="mx-auto max-w-4xl px-[23px] pt-[38px] pb-[91px] lg:pt-[61px]">
          <h1 className="text-[38px] font-light leading-[1.05] tracking-[-1.14px] text-ink md:text-[46px]">
            Roadmap
          </h1>
          <p className="mt-[19px] max-w-[52ch] text-[16px] leading-relaxed text-ink-secondary">
            What I&apos;m working on right now. More will show up here as it
            happens.
          </p>
        </section>
      </div>

      <section className="bg-canvas py-[91px]">
        <div className="mx-auto max-w-4xl px-[23px]">
          <div className="relative pl-[30px]">
            <div className="absolute left-[4px] top-[6px] bottom-[6px] w-px bg-ink-mute" />

            {TIMELINE.map((item, i) => (
              <div
                key={item.title}
                className={
                  i === TIMELINE.length - 1
                    ? "relative"
                    : "relative mb-[38px]"
                }
              >
                <span
                  className={
                    item.status === "Jejaku Beta v0.0.1"
                      ? "absolute -left-[30px] top-[5px] h-[9px] w-[9px] rounded-full bg-primary"
                      : "absolute -left-[30px] top-[5px] h-[9px] w-[9px] rounded-full border-2 border-hairline-input bg-canvas"
                  }
                />
                <p className="text-[12px] font-medium uppercase tracking-[0.1px] text-ink-mute">
                  {item.status}
                </p>
                <h3 className="mt-[8px] text-[16px] font-medium text-ink">
                  {item.title}
                </h3>
                <p className="mt-[8px] max-w-xl text-[14px] leading-relaxed text-ink-mute">
                  {item.body}
                </p>
                {item.date && (
                  <p className="tabular mt-[11px] text-[12px] text-ink-mute">
                    {item.dateLabel} {item.date}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
