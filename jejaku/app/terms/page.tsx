import type { Metadata } from "next";
import Link from "next/link";
import FlowLines from "../components/FlowLines";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service — Jejaku",
  description: "The short version: this is a free personal project — use it, but there's no promise it'll always be here.",
};

export default function TermsPage() {
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

          <section className="mx-auto max-w-4xl px-[23px] pt-[38px] pb-[61px] lg:pt-[61px]">
            <h1 className="text-[38px] font-light leading-[1.05] tracking-[-1.14px] text-ink md:text-[46px]">
              Terms of Service
            </h1>
            <p className="mt-[19px] max-w-[52ch] text-[16px] leading-relaxed text-ink-secondary">
              The short version: this is a free personal project — use it, but there&apos;s no promise it&apos;ll always be here.
            </p>
            <p className="mt-[8px] text-[12px] text-ink-mute">Last updated 2026-09-04.</p>
          </section>
        </div>
      </div>

      <section className="bg-canvas py-[61px]">
        <div className="mx-auto flex max-w-3xl flex-col gap-[38px] px-[23px]">
          <div>
            <h2 className="text-[18px] font-medium text-ink">What this is</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              Jejaku is a personal site — things built while learning, free to use, nothing for
              sale. That covers everything under the Jejaku name: this site, Jejaku Receipt, and
              anything else added later. One account works across all of them.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Accounts</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              You sign in with a one-time code sent to your email, or with a Google account —
              whichever you use, you&apos;re responsible for keeping access to it secure, since
              that&apos;s what controls access to your Jejaku account too.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">No warranty, actively changing</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              This is beta software, built and run by one person on their own server, not a
              company with an uptime guarantee. Features can change, break, or disappear without
              notice — the <Link href="/changelog" className="text-primary hover:underline">changelog</Link>{" "}
              is the closest thing to a running record of what&apos;s shipped. It&apos;s provided
              as-is, with no warranty of any kind — use it at your own risk, and don&apos;t rely
              on it for anything you can&apos;t afford to lose.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Acceptable use</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              Don&apos;t try to break, overload, or gain unauthorized access to the service, and
              don&apos;t upload anything illegal or that you don&apos;t have the right to upload
              (a scanned receipt is fine; someone else&apos;s private documents are not).
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Your content</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              Whatever you enter or scan — expenses, receipt photos, notes — is yours. It&apos;s
              stored so the app can show it back to you, not used for anything else. See the{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>{" "}
              for exactly what&apos;s collected and where it lives.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Changes to these terms</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              This page may be updated as the project grows. Meaningful changes will show up in
              the changelog.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
