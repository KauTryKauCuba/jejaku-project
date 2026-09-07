"use client";

import { useCallback, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { useProfile } from "../lib/useProfile";
import { getInitials } from "../lib/initials";
import { jejakuUrl } from "../lib/jejakuUrl";
import { useDismissable } from "../lib/useDismissable";
import MemberCard from "./MemberCard";

export default function UserBadge() {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useDismissable(
    open,
    rootRef,
    useCallback(() => setOpen(false), [])
  );

  if (!profile) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-[8px]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-canvas-soft text-[11px] font-medium text-primary-deep">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              width={28}
              height={28}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(profile.fullName)
          )}
        </span>
        <span className="hidden whitespace-nowrap text-[14px] font-medium text-ink sm:inline">
          {profile.fullName}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 w-[280px] pt-[12px]">
          <div style={{ perspective: 1000 }}>
            <MemberCard profile={profile} />
          </div>
          <button
            type="button"
            onClick={() => {
              signOut({ redirect: true, callbackUrl: jejakuUrl("/") });
            }}
            className="mt-[10px] flex h-[33px] w-full items-center justify-center rounded-pill border border-hairline-input bg-canvas text-[13px] font-medium text-ink-mute transition-colors hover:bg-hairline"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
