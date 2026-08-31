"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { User } from "@phosphor-icons/react";
import FormField from "./FormField";
import AvatarCropModal from "./AvatarCropModal";
import MemberCard from "./MemberCard";
import { getInitials } from "../lib/initials";
import type { SessionProfile } from "../types/next-auth";

export default function SettingsForm({ profile }: { profile: SessionProfile }) {
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayProfile, setDisplayProfile] = useState(profile);
  const [fullName, setFullName] = useState(profile.fullName);
  const [pendingImage, setPendingImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (pendingImage) {
    return (
      <div className="rounded-lg border border-hairline bg-canvas p-[24px]">
        <AvatarCropModal
          imageSrc={pendingImage}
          onCancel={() => setPendingImage(undefined)}
          onSave={async (avatarUrl) => {
            setPendingImage(undefined);
            setDisplayProfile((prev) => ({ ...prev, avatarUrl }));
            await update({});
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-[23px] md:grid-cols-[1fr_280px]">
      <form
        className="flex flex-col gap-5 rounded-lg border border-hairline bg-canvas p-[24px]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!fullName.trim()) {
            setError("Enter your full name.");
            return;
          }
          setError(undefined);
          setSaved(false);
          setSaving(true);
          try {
            const res = await fetch("/api/users/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fullName: fullName.trim() }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              setError(data.error ?? "Couldn't save your profile. Try again.");
              return;
            }
            setDisplayProfile((prev) => ({ ...prev, fullName: fullName.trim() }));
            await update({});
            setSaved(true);
          } catch {
            setError("Couldn't save your profile. Try again.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline-input bg-canvas-soft text-ink-mute transition-colors hover:bg-hairline"
            aria-label="Upload avatar"
          >
            {displayProfile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayProfile.avatarUrl}
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
              {displayProfile.avatarUrl ? "Change photo" : "Add a photo"}
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
            setSaved(false);
          }}
          error={error}
        />

        <div>
          <label className="text-[14px] font-medium text-ink">Email</label>
          <p className="mt-[6px] text-[14px] text-ink-mute">{profile.email}</p>
        </div>

        <div className="mt-2 flex items-center gap-[11px]">
          <button
            type="submit"
            disabled={saving}
            className="flex h-[37px] items-center justify-center rounded-pill bg-primary px-4 text-[16px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-[13px] text-ink-mute">Saved.</span>}
        </div>
      </form>

      <div style={{ perspective: 1000 }}>
        <MemberCard profile={displayProfile} />
      </div>
    </div>
  );
}
