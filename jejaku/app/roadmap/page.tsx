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
    date: "Saturday, August 29, 2026",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Polishing Jejaku",
    body: "Ongoing tweaks to the design system, the onboarding flow, and the landing page content — refining what's already here before starting on anything new. Jejaku Receipt waits until this feels right, not perfect.",
    dateLabel: "Started",
    date: "Saturday, August 29, 2026",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Accounts, onboarding & dashboard",
    body: "Email sign-in, a profile setup step with an avatar and a holographic member card, and a signed-in dashboard at its own URL that swaps in automatically once you're set up.",
    dateLabel: "Shipped",
    date: "Saturday, August 29, 2026",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Jejaku Receipt gets its own look",
    body: "Gave Jejaku Receipt its own blue theme and linked navigation (roadmap, logo) between the two apps.",
    dateLabel: "Shipped",
    date: "Saturday, August 29, 2026",
  },
  {
    status: "Jejaku Tree Beta v0.0.1",
    title: "Jejaku Tree, a new idea",
    body: "A family tree you actually add people to — parents, siblings, kids, grandparents — one relative at a time. Just a concept card on the landing page for now, no build yet.",
    dateLabel: "Shipped",
    date: "Saturday, August 29, 2026",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "One sign-in across both apps",
    body: "Signing in on Jejaku now carries your session into Jejaku Receipt automatically, and signing out of either one signs you out of both — no separate accounts to juggle between the two.",
    dateLabel: "Shipped",
    date: "Saturday, August 29, 2026",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "A real dashboard for Jejaku Receipt",
    body: "Rebuilt the dashboard with a proper sidebar and navbar shell — a collapsible icon rail on mobile, full labels on desktop, and the same gradient header as the rest of the site.",
    dateLabel: "Shipped",
    date: "Saturday, August 29, 2026",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "\"Use this system\" now points to the right place",
    body: "The Jejaku Receipt card's launch button was hardcoded to an old local address. It's now configured per environment, so it correctly opens Jejaku Receipt both locally and in production.",
    dateLabel: "Shipped",
    date: "Sunday, August 30, 2026",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Custom dropdown and date picker",
    body: "Swapped the browser's native category dropdown and date input for themed ones that actually match the app — no more OS-styled popups breaking the design mid-form.",
    dateLabel: "Shipped",
    date: "Sunday, August 30, 2026",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "A sign-in code email that looks like Jejaku",
    body: "The OTP email went from plain text to a branded one — the logo, gradient mesh, and flow lines from the site, plus a live countdown before you're allowed to request a new code.",
    dateLabel: "Shipped",
    date: "Sunday, August 30, 2026",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Google sign-in, with a code to back it up",
    body: "\"Continue with Google\" now actually works — and still asks for a quick email code afterward, right on the landing page, before you're signed in for real.",
    dateLabel: "Shipped",
    date: "Sunday, August 30, 2026",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Your name and photo actually stick around",
    body: "First sign-in saves your name and avatar for real. Come back later — by email or Google, doesn't matter which — and it's already there, no re-entering anything.",
    dateLabel: "Shipped",
    date: "Sunday, August 30, 2026",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Expenses and receipt photos, saved for real",
    body: "Expenses and scanned receipt photos used to live only in your browser and disappeared the moment you cleared it. Both now save to the server against your account — add one on your phone, see it on your laptop.",
    dateLabel: "Shipped",
    date: "Sunday, August 30, 2026",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Scan finds the receipt for you",
    body: "Point the camera at a receipt and hold it steady — no need to tap the shutter. A quick check confirms it's actually in frame before the photo is taken automatically.",
    dateLabel: "Shipped",
    date: "Monday, August 31, 2026",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Automatic receipt extraction",
    body: "Scanning a receipt no longer means typing in the merchant, amount, and date yourself — they're read straight from the photo and pre-filled, ready to check over and save.",
    dateLabel: "Shipped",
    date: "Monday, August 31, 2026",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Receipt photos that actually show up",
    body: "Fixed a bug where a scanned receipt's thumbnail could silently fail to load after a server restart — the photo was always saved, it just wasn't being served correctly.",
    dateLabel: "Shipped",
    date: "Monday, August 31, 2026",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Profile photos that actually persist",
    body: "Uploading a photo during sign-up looked like it worked, but it never really saved anywhere — it only lived in that one browser tab. Photos now genuinely upload and stick around.",
    dateLabel: "Shipped",
    date: "Monday, August 31, 2026",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "A real Settings page",
    body: "Added a place to change your name and photo after signing up, on both apps — previously the only chance to set a photo was during onboarding, with no way to update it later.",
    dateLabel: "Shipped",
    date: "Monday, August 31, 2026",
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
                    item.dateLabel === "Shipped" || item.dateLabel === "Started"
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
