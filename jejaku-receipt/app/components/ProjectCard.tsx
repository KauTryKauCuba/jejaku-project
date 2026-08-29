"use client";

import { useState } from "react";
import { Lock } from "@phosphor-icons/react";
import ReceiptIllustration from "./ReceiptIllustration";
import { useStoredProfile } from "../lib/session";

export default function ProjectCard({
  project,
  collapsible = false,
}: {
  project: { tag: string; title: string; body: string; shortBody?: string };
  collapsible?: boolean;
}) {
  const loggedIn = useStoredProfile() !== null;
  const [expanded, setExpanded] = useState(false);

  const showShort = collapsible && !expanded && project.shortBody;

  return (
    <div className="flex flex-col rounded-lg border border-hairline bg-canvas p-[30px]">
      <ReceiptIllustration />
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
      {loggedIn ? (
        <button
          type="button"
          className="mt-[23px] flex h-[37px] w-full items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
        >
          Use this system
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
