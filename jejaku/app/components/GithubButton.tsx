import { GithubLogo } from "@phosphor-icons/react";

// Visual placeholder only — no GitHub provider is configured in auth.ts
// yet, so this doesn't call signIn() and isn't clickable. Swap in a real
// handler once the provider exists.
export default function GithubButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex h-[37px] w-full cursor-not-allowed items-center justify-center gap-[10px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink opacity-50"
    >
      <GithubLogo size={16} weight="fill" aria-hidden="true" />
      {label}
    </button>
  );
}
