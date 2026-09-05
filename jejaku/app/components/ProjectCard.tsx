"use client";

import { useState, type ComponentType, type CSSProperties } from "react";
import Link from "next/link";
import { Lock, Hourglass } from "@phosphor-icons/react";
import ReceiptIllustration from "./ReceiptIllustration";
import { useProfile } from "../lib/useProfile";

type Accent = {
  primary: string;
  primaryDeep: string;
  primaryPress: string;
  primarySoft: string;
  primarySubdued: string;
  hairline: string;
  hairlineInput: string;
  ink: string;
  inkMute: string;
  canvasSoft: string;
};

export default function ProjectCard({
  project,
  collapsible = false,
  showLearnMore = true,
}: {
  project: {
    tag: string;
    title: string;
    body: string;
    shortBody?: string;
    url?: string;
    /** Where "Learn more" goes — separate from `url` (which is gated on
     * being logged in) since this is meant to be readable by anyone. No
     * link at all (Jejaku Tree, for now) just renders an inert button. */
    learnMoreUrl?: string;
    illustration?: ComponentType;
    accent?: Accent;
  };
  collapsible?: boolean;
  /** Off on the signed-in dashboard — "Use this system" is already the
   * card's whole point there, so a second "go read about it" button next
   * to it is redundant in a way it isn't on the public landing page. */
  showLearnMore?: boolean;
}) {
  const { loggedIn } = useProfile();
  const [expanded, setExpanded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleUse = () => {
    if (!project.url || syncing) return;
    setSyncing(true);
    setTimeout(() => {
      window.location.href = project.url!;
    }, 1600);
  };

  const showShort = collapsible && !expanded && project.shortBody;
  const Illustration = project.illustration ?? ReceiptIllustration;

  // Overrides the shared design tokens for just this card's subtree — every
  // `bg-primary`/`border-hairline-input`/etc. class below (including inside
  // ReceiptIllustration, which reads these same variables) picks this up,
  // so scoping the override here — rather than touching the site-wide
  // tokens in globals.css — recolors only this card.
  const accentStyle = project.accent
    ? ({
        "--color-primary": project.accent.primary,
        "--color-primary-deep": project.accent.primaryDeep,
        "--color-primary-press": project.accent.primaryPress,
        "--color-primary-soft": project.accent.primarySoft,
        "--color-primary-subdued": project.accent.primarySubdued,
        "--color-hairline": project.accent.hairline,
        "--color-hairline-input": project.accent.hairlineInput,
        "--color-ink": project.accent.ink,
        "--color-ink-mute": project.accent.inkMute,
        "--color-canvas-soft": project.accent.canvasSoft,
      } as CSSProperties)
    : undefined;

  return (
    <div className="flex flex-col rounded-lg border border-hairline bg-canvas p-[30px]" style={accentStyle}>
      <Illustration />
      <span className="mt-[23px] inline-flex w-fit items-center rounded-pill bg-primary-subdued px-[8px] py-[4px] text-[9px] font-medium uppercase tracking-[0.1px] text-primary-deep">
        {project.tag}
      </span>
      <h3 className="mt-[19px] text-[19px] font-light tracking-[-0.19px] text-ink">
        {project.title}
      </h3>
      <p className="mt-[8px] flex-1 text-[14px] leading-relaxed text-ink-mute">
        {showShort ? project.shortBody : project.body}
      </p>
      {collapsible && project.shortBody && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-[8px] w-fit text-[13px] font-medium text-primary"
        >
          {expanded ? "View less" : "View more"}
        </button>
      )}
      {!project.url ? (
        <span
          aria-disabled="true"
          className="mt-[23px] flex h-[37px] w-full cursor-not-allowed items-center justify-center gap-[8px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink-mute"
        >
          <Hourglass size={13} weight="light" />
          Coming soon
        </span>
      ) : loggedIn ? (
        <button
          type="button"
          onClick={handleUse}
          disabled={syncing}
          className="mt-[23px] flex h-[37px] w-full items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {syncing ? "Synchronizing data…" : "Use this system"}
        </button>
      ) : (
        <span
          aria-disabled="true"
          title="Log in or register to use this project"
          className="mt-[23px] flex h-[37px] w-full cursor-not-allowed items-center justify-center gap-[8px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink-mute"
        >
          <Lock size={13} weight="light" />
          Log in to use
        </span>
      )}

      {/* Shows for every project regardless of login/url state (including
          "Coming soon" ones like Jejaku Tree), since it's meant to link to
          a project's own info rather than gate on using it — except on
          the dashboard (showLearnMore=false), where it'd just duplicate
          "Use this system". Solid-filled with bg-primary/text-on-primary,
          same as the CTA above — reads the same accent-scoped tokens, so
          it's Jejaku Receipt's blue on that card and jejaku's teal on
          Jejaku Tree's, automatically. Renders as an inert button (no
          destination yet) when a project has no learnMoreUrl set —
          Jejaku Tree, for now. */}
      {showLearnMore &&
        (project.learnMoreUrl ? (
          <Link
            href={project.learnMoreUrl}
            className="mt-[8px] flex h-[37px] w-full items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
          >
            Learn more
          </Link>
        ) : (
          <button
            type="button"
            className="mt-[8px] flex h-[37px] w-full items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
          >
            Learn more
          </button>
        ))}
    </div>
  );
}
