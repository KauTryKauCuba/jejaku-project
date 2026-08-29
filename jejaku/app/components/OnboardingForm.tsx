"use client";

import { useRef, useState } from "react";
import { User } from "@phosphor-icons/react";
import FormField from "./FormField";
import AvatarCropModal from "./AvatarCropModal";
import { getInitials } from "../lib/initials";
import type { StoredProfile } from "../lib/session";

export type OnboardingProfile = StoredProfile;

export default function OnboardingForm({
  email,
  onComplete,
}: {
  email?: string;
  onComplete: (profile: OnboardingProfile) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [pendingImage, setPendingImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  if (pendingImage) {
    return (
      <AvatarCropModal
        imageSrc={pendingImage}
        onCancel={() => setPendingImage(undefined)}
        onSave={(croppedUrl) => {
          setAvatarUrl(croppedUrl);
          setPendingImage(undefined);
        }}
      />
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!fullName.trim()) {
          setError("Enter your full name.");
          return;
        }
        setError(undefined);
        onComplete({
          fullName: fullName.trim(),
          avatarUrl,
          email,
          registeredAt: new Date().toISOString(),
        });
      }}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline-input bg-canvas-soft text-ink-mute transition-colors hover:bg-hairline"
          aria-label="Upload avatar"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : fullName.trim() ? (
            <span className="text-[22px] font-medium text-primary-deep">
              {getInitials(fullName)}
            </span>
          ) : (
            <User size={24} weight="light" />
          )}
        </button>
        <div className="flex flex-col gap-[2px]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-left text-[14px] font-medium text-primary"
          >
            {avatarUrl ? "Change photo" : "Add a photo"}
          </button>
          <span className="text-[12px] text-ink-mute">Optional, PNG or JPG</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setPendingImage(URL.createObjectURL(file));
            e.target.value = "";
          }}
        />
      </div>

      <FormField
        id="fullName"
        label="Full name"
        placeholder="Jane Doe"
        autoComplete="name"
        value={fullName}
        onChange={(value) => {
          setFullName(value);
          if (error) setError(undefined);
        }}
        error={error}
      />

      <button
        type="submit"
        className="mt-2 flex h-[37px] items-center justify-center rounded-pill bg-primary px-4 text-[16px] font-medium text-on-primary transition-transform active:scale-[0.98]"
      >
        Continue
      </button>
    </form>
  );
}
