"use client";

import { ClipboardText, Browsers, Hourglass } from "@phosphor-icons/react/dist/ssr";
import HeroAuthCard from "./HeroAuthCard";
import FlowLines from "./FlowLines";
import IconFlowBadge from "./IconFlowBadge";
import ProjectCard from "./ProjectCard";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useProfile } from "../lib/useProfile";
import { formatIsoMinute } from "../lib/formatIso";

// Still referenced below only by the (currently unreachable in this app —
// see the isDashboard branches further down) dashboard variant, kept for
// parity with jejaku's own copy of this component, where that variant is
// actually used.
const PROJECTS = [
  {
    tag: "beta",
    title: "Jejaku Receipt",
    shortBody:
      "A receipt scanner that turns a photo into structured expense data, powered by AI vision extraction.",
    body: "A receipt scanner that turns a photo into structured expense data, powered by AI vision extraction. Tried Groq, Gemini, Mistral OCR, locally-hosted Qwen and DeepSeek, PaddleOCR, Moondream, and Tesseract first — landed on this instead. Free to try.",
  },
];

export default function HomeContent({
  variant = "public",
}: {
  variant?: "public" | "dashboard";
}) {
  const isDashboard = variant === "dashboard";
  const { profile } = useProfile();
  const firstName = profile?.fullName?.split(" ")[0];

  const auditValue = profile
    ? `Account created ${formatIsoMinute(new Date(profile.registeredAt))}`
    : "No activity yet";
  const auditDetail = "A log of sign-ins and account changes.";

  const DASHBOARD_CARDS = [
    {
      icon: ClipboardText,
      label: "Audit trail",
      value: auditValue,
      detail: auditDetail,
    },
    {
      icon: Browsers,
      label: "Currently using",
      value: PROJECTS[0]?.title ?? "None yet",
      detail: "The system you have open right now.",
    },
    {
      icon: Hourglass,
      label: "Coming soon",
      value: "TBA",
      detail: "A new system is in the works.",
    },
    {
      icon: Hourglass,
      label: "Coming soon",
      value: "TBA",
      detail: "A new system is in the works.",
    },
  ];

  const projectsHeading = (
    <div className="max-w-xl">
      {isDashboard && firstName && (
        <p className="mb-[8px] text-[15px] text-ink-mute">
          Hey, {firstName}
        </p>
      )}
      <h2 className="text-[30px] font-light leading-[1.1] tracking-[-0.61px] text-ink">
        {isDashboard ? "Dashboard" : "Projects"}
      </h2>
      <p className="mt-[11px] text-[15px] leading-relaxed text-ink-mute">
        {isDashboard
          ? "Pick where you want to go."
          : "A running list of what I've built. All free to use."}
      </p>
    </div>
  );

  const dashboardCardsGrid = (
    <div className="mt-[30px] grid gap-[15px] sm:grid-cols-2 lg:grid-cols-4">
      {DASHBOARD_CARDS.map(({ icon: Icon, label, value, detail }, i) => (
        <div
          key={label + i}
          className="rounded-lg border border-hairline bg-canvas p-[19px]"
        >
          <IconFlowBadge size={40} seed={i + 1}>
            <Icon size={16} weight="light" />
          </IconFlowBadge>
          <p className="mt-[15px] text-[11px] font-medium uppercase tracking-[0.1px] text-ink-mute">
            {label}
          </p>
          <p className="mt-[4px] text-[16px] font-light tracking-[-0.16px] text-ink">
            {value}
          </p>
          <p className="mt-[4px] text-[13px] leading-relaxed text-ink-mute">
            {detail}
          </p>
        </div>
      ))}
    </div>
  );

  const projectsGrid = (
    <div className="mt-[46px] grid gap-[23px] md:grid-cols-2 lg:grid-cols-3">
      {PROJECTS.map((project) => (
        <ProjectCard
          key={project.title}
          project={project}
          collapsible={isDashboard}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Hero on gradient mesh */}
      <div className="gradient-mesh">
        <div className="mesh-blob" aria-hidden="true" />
        <FlowLines />
        <SiteHeader />

        {isDashboard ? (
          <section
            id="projects"
            className="mx-auto max-w-6xl px-[23px] pt-[38px] pb-[91px] lg:pt-[61px]"
          >
            {projectsHeading}
            {dashboardCardsGrid}
            {projectsGrid}
          </section>
        ) : (
          <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-[46px] px-[23px] pt-[38px] pb-[91px] lg:grid-cols-2 lg:gap-[61px] lg:pt-[61px]">
            <div>
              <h1 className="text-[38px] font-light leading-[1.05] tracking-[-1.14px] text-ink md:text-[53px] md:tracking-[-1.33px]">
                Things I built
                <br />
                while learning
              </h1>
              <p className="mt-[23px] max-w-[46ch] text-[16px] leading-relaxed text-ink-secondary">
                Jejaku is where I put projects after I finish them. Free to
                use, nothing for sale.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroAuthCard />
            </div>
          </section>
        )}
      </div>

      {/* Cream interlude */}
      {!isDashboard && (
      <section className="bg-canvas-cream py-[76px]">
        <div className="mx-auto max-w-3xl px-[23px] text-center">
          <h2 className="text-[25px] font-light leading-[1.12] tracking-[-0.25px] text-ink">
            None of this is finished
          </h2>
          <p className="mx-auto mt-[15px] max-w-lg text-[15px] leading-relaxed text-ink-secondary">
            I keep working on these after posting them. Expect changes.
          </p>
        </div>
      </section>
      )}

      <SiteFooter />
    </>
  );
}
