"use client";

import {
  Brain,
  Compass,
  Lightbulb,
  UsersThree,
  Plant,
  Cpu,
  GraphicsCard,
  Memory,
  HardDrive,
  Terminal,
  ClipboardText,
  Browsers,
  Hourglass,
} from "@phosphor-icons/react/dist/ssr";
import HeroAuthCard from "./HeroAuthCard";
import FlowLines from "./FlowLines";
import IconFlowBadge from "./IconFlowBadge";
import ProjectCard from "./ProjectCard";
import PixelFaceIcon from "./PixelFaceIcon";
import TechLogo from "./TechLogo";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ValuesSpecsTabs from "./ValuesSpecsTabs";
import { useProfile } from "../lib/useProfile";
import { formatIsoMinute } from "../lib/formatIso";

const VALUES = [
  {
    icon: Compass,
    title: "Curiosity first, product second",
    body: "Every project here starts as a question I can't let go of. The project is just what's left after I find out.",
  },
  {
    icon: Brain,
    title: "The exploring is the point",
    body: "I don't settle on the first tool that works. I'll try the paid option, the free one, and a couple local ones before I trust which is actually right for the job.",
  },
  {
    icon: Lightbulb,
    title: "No cost, no catch",
    body: "Whatever I find out, I ship for free — to use, copy, or take apart.",
  },
  {
    icon: UsersThree,
    title: "Conversations started this",
    body: "None of this began with me. Talking to people who shared what they knew or thought out loud is what sparked the questions — so I'm just passing that along.",
  },
  {
    icon: Plant,
    title: "For the habit, not the title",
    body: "I'm not trying to be the best at this, or make it my career. I'm just building a habit worth keeping — learn something, hold onto it, put it to use, pass it on.",
  },
  {
    icon: PixelFaceIcon,
    title: "Your time is limited",
    body: "“Your time is limited, so don't waste it living someone else's life.” — Steve Jobs",
  },
];

const SPECS = [
  { icon: Cpu, label: "CPU", value: "Intel i7-7700HQ @ 2.80GHz", detail: "4 cores / 8 threads, Kaby Lake" },
  { icon: GraphicsCard, label: "GPU", value: "GTX 1050 Mobile (4GB)", detail: "+ Intel HD Graphics 630, hybrid" },
  { icon: Memory, label: "RAM", value: "16GB", detail: "15Gi usable" },
  { icon: HardDrive, label: "Storage", value: "223.6GB NVMe SSD", detail: "Kingston SA1000M8240G" },
  { icon: Terminal, label: "OS", value: "Ubuntu 24.04.4 LTS", detail: "Linux 6.8.0-138-generic" },
];

const STACK = [
  { logo: "nextdotjs", label: "Framework", value: "Next.js", detail: "App Router, React Server Components" },
  { logo: "postgresql", label: "Database", value: "PostgreSQL", detail: "Self-hosted, on the box above" },
  { logo: "cloudflare", label: "Networking", value: "Cloudflare Tunnel", detail: "No open ports, no exposed IP" },
  { logo: "nginx", label: "Reverse proxy", value: "nginx", detail: "Sits in front of the app" },
  { logo: "drizzle", label: "ORM", value: "Drizzle Kit", detail: "Migrations and schema, typed" },
  { logo: "tailwindcss", label: "Styling", value: "Tailwind CSS", detail: "Utility-first, design tokens on top" },
  { logo: "typescript", label: "Language", value: "TypeScript", detail: "Everywhere, no exceptions" },
  { logo: "git", label: "Source control", value: "Git", detail: "Self-hosted + GitHub mirrors" },
  { logo: "claude", label: "Pair programmer", value: "Claude Code", detail: "Most of this site, written with it" },
];

const PROJECTS = [
  {
    tag: "beta",
    title: "Jejaku Receipt",
    shortBody:
      "A receipt scanner that turns a photo into structured expense data, powered by Claude Sonnet 5.",
    body: "A receipt scanner that turns a photo into structured expense data, powered by Claude Sonnet 5. Built after evaluating a range of OCR approaches — including Groq, Gemini, Mistral OCR, locally-hosted Qwen and DeepSeek via Ollama, PaddleOCR, Moondream, and Tesseract — before settling on this one. Free to try.",
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

      {!isDashboard && (
        <section id="projects" className="bg-canvas py-[91px]">
          <div className="mx-auto max-w-6xl px-[23px]">
            {projectsHeading}
            {projectsGrid}
          </div>
        </section>
      )}

      {/* Values / Specs tabs */}
      {!isDashboard && (
      <section className="bg-gradient-to-b from-canvas via-canvas-soft to-canvas-soft py-[91px]">
        <div className="mx-auto max-w-6xl px-[23px]">
          <ValuesSpecsTabs
            valuesContent={
              <div className="grid gap-[23px] md:grid-cols-3">
                {VALUES.map(({ icon: Icon, title, body }, i) => (
                  <div
                    key={title}
                    className="rounded-lg border border-hairline bg-canvas p-[30px]"
                  >
                    <IconFlowBadge size={57} seed={i + 1}>
                      <Icon size={22} weight="light" />
                    </IconFlowBadge>
                    <h3 className="mt-[23px] text-[19px] font-light tracking-[-0.19px] text-ink">
                      {title}
                    </h3>
                    <p className="mt-[8px] text-[14px] leading-relaxed text-ink-mute">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            }
            specsContent={
              <div className="grid gap-[23px] md:grid-cols-3">
                {SPECS.map(({ icon: Icon, label, value, detail }, i) => (
                  <div
                    key={label}
                    className="rounded-lg border border-hairline bg-canvas p-[30px]"
                  >
                    <IconFlowBadge size={57} seed={i + 1}>
                      <Icon size={22} weight="light" />
                    </IconFlowBadge>
                    <p className="mt-[23px] text-[12px] font-medium uppercase tracking-[0.1px] text-ink-mute">
                      {label}
                    </p>
                    <p className="tabular mt-[4px] text-[19px] font-light tracking-[-0.19px] text-ink">
                      {value}
                    </p>
                    <p className="mt-[8px] text-[14px] leading-relaxed text-ink-mute">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            }
            stackContent={
              <div className="grid gap-[23px] md:grid-cols-3">
                {STACK.map(({ logo, label, value, detail }, i) => (
                  <div
                    key={label}
                    className="rounded-lg border border-hairline bg-canvas p-[30px]"
                  >
                    <IconFlowBadge size={57} seed={i + 1}>
                      <TechLogo slug={logo} label={value} size={22} />
                    </IconFlowBadge>
                    <p className="mt-[23px] text-[12px] font-medium uppercase tracking-[0.1px] text-ink-mute">
                      {label}
                    </p>
                    <p className="mt-[4px] text-[19px] font-light tracking-[-0.19px] text-ink">
                      {value}
                    </p>
                    <p className="mt-[8px] text-[14px] leading-relaxed text-ink-mute">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </section>
      )}

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
