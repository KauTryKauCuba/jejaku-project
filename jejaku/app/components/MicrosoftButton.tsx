// Visual placeholder only — no Microsoft provider is configured in
// auth.ts yet, so this doesn't call signIn() and isn't clickable. Swap in
// a real handler once the provider exists.
export default function MicrosoftButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex h-[37px] w-full cursor-not-allowed items-center justify-center gap-[10px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink opacity-50"
    >
      <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </svg>
      {label}
    </button>
  );
}
