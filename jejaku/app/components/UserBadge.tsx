"use client";

import { useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useProfile } from "../lib/useProfile";
import { getInitials } from "../lib/initials";
import MemberCard from "./MemberCard";
import AvatarCropModal from "./AvatarCropModal";

export default function UserBadge() {
  const { profile } = useProfile();
  const { update } = useSession();
  const [hovered, setHovered] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-[8px]">
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
      </div>

      <div
        className={`pointer-events-none fixed inset-0 z-10 bg-ink/40 transition-opacity duration-300 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {hovered && (
        <div className="absolute right-0 top-full z-20 w-[280px] pt-[12px]">
          <div style={{ perspective: 1000 }}>
            <MemberCard profile={profile} />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-[8px] flex h-[33px] w-full items-center justify-center rounded-pill border border-hairline-input bg-canvas text-[13px] font-medium text-ink-mute transition-colors hover:bg-hairline"
          >
            Change photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPendingImage(URL.createObjectURL(file));
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => {
              signOut({ redirect: true, callbackUrl: "/" });
            }}
            className="mt-[8px] flex h-[33px] w-full items-center justify-center rounded-pill border border-hairline-input bg-canvas text-[13px] font-medium text-ink-mute transition-colors hover:bg-hairline"
          >
            Log out
          </button>
        </div>
      )}

      {pendingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-[19px]">
          <div className="w-full max-w-[358px] rounded-lg border border-hairline bg-canvas p-[24px]">
            <AvatarCropModal
              imageSrc={pendingImage}
              onCancel={() => setPendingImage(undefined)}
              onSave={async () => {
                setPendingImage(undefined);
                await update({});
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
