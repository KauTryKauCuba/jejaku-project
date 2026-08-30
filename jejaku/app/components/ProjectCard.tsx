"use client";

import { useState, type ComponentType } from "react";
import { Lock, Hourglass } from "@phosphor-icons/react";
import ReceiptIllustration from "./ReceiptIllustration";
import { useProfile } from "../lib/useProfile";

export default function ProjectCard({
  project,
  collapsible = false,
}: {
  project: {
    tag: string;
    title: string;
    body: string;
    shortBody?: string;
    url?: string;
    illustration?: ComponentType;
  };
  collapsible?: boolean;
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

  return (
    <div className="flex flex-col rounded-lg border border-hairline bg-canvas p-[30px]">
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
    </div>
  );
}
