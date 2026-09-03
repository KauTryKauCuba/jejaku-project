import type { Metadata } from "next";
import Link from "next/link";
import FlowLines from "../components/FlowLines";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — Jejaku",
  description: "What's collected, why, and who else ever sees it.",
};

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-[19px] max-w-[52ch] text-[16px] leading-relaxed text-ink-secondary">
              What&apos;s collected, why, and who else ever sees it.
            </p>
            <p className="mt-[8px] text-[12px] text-ink-mute">Last updated 2026-09-04.</p>
          </section>
        </div>
      </div>

      <section className="bg-canvas py-[61px]">
        <div className="mx-auto flex max-w-3xl flex-col gap-[38px] px-[23px]">
          <div>
            <h2 className="text-[18px] font-medium text-ink">What&apos;s collected</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              Your email address, full name, and avatar — from Google if you sign in that way, or
              entered by hand otherwise — plus sign-in timestamps.
            </p>
            <p className="mt-[8px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              If you use <strong className="font-medium text-ink">Jejaku Receipt</strong>, also:
              the expenses you add or scan (merchant, amount, date, category, tax, notes,
              city/state/country, currency), any receipt photos you upload, and your default
              currency.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">How it&apos;s used</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              Only to run the features you&apos;re actually using — showing your own expenses
              back to you, pre-filling a form from a scanned receipt, keeping you signed in. Not
              used for advertising, not sold, not shared with data brokers.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Third parties involved</h2>
            <ul className="mt-[11px] flex max-w-[65ch] flex-col gap-[8px] text-[14px] leading-relaxed text-ink-mute">
              <li>
                <strong className="font-medium text-ink">Google</strong> — if you sign in with
                Google, Google handles that authentication; only your name, email, and photo are
                passed back to Jejaku.
              </li>
              <li>
                <strong className="font-medium text-ink">Resend</strong> — sends the one-time
                sign-in code to your email.
              </li>
              <li>
                <strong className="font-medium text-ink">DeepSeek</strong> — when you scan a
                receipt in Jejaku Receipt, that photo is sent to DeepSeek&apos;s API to read its
                contents (merchant, amount, items, etc.).
              </li>
              <li>
                <strong className="font-medium text-ink">Cloudflare</strong> — sits in front of
                this site as a reverse proxy; sees standard connection details like your IP
                address, the same as any site behind a CDN.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Where your data lives</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              On the developer&apos;s own server — a self-hosted Postgres database, not a
              third-party cloud database vendor — and receipt photos are stored on that same
              server&apos;s disk.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Cookies &amp; tracking</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              One cookie, to keep you signed in — no advertising or tracking cookies, and no
              analytics scripts run on this site at all.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Deleting your data</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              In Jejaku Receipt, Settings has a Danger Zone that lets you permanently delete every
              expense on your account yourself. There&apos;s no self-serve full account deletion
              yet.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Children</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              This site isn&apos;t directed at children and isn&apos;t designed to collect data
              from them knowingly.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-ink">Changes to this policy</h2>
            <p className="mt-[11px] max-w-[65ch] text-[14px] leading-relaxed text-ink-mute">
              This page may be updated as the project grows. Meaningful changes will show up in
              the <Link href="/changelog" className="text-primary hover:underline">changelog</Link>.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
