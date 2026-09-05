import { DiscordLogo } from "@phosphor-icons/react";

// Visual placeholder only — no Discord provider is configured in
// auth.ts, so this doesn't call signIn() and isn't clickable. Swap in
// a real handler once the provider exists.
export default function DiscordButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex h-[37px] w-full cursor-not-allowed items-center justify-center gap-[10px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink opacity-50"
    >
      <DiscordLogo size={16} weight="fill" aria-hidden="true" />
      {label}
    </button>
  );
}
