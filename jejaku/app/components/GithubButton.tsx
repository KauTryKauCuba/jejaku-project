"use client";

import { signIn } from "next-auth/react";
import { GithubLogo } from "@phosphor-icons/react";

export default function GithubButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/" })}
      className="flex h-[37px] w-full items-center justify-center gap-[10px] rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink transition-colors hover:bg-canvas-soft active:scale-[0.98]"
    >
      <GithubLogo size={16} weight="fill" aria-hidden="true" />
      {label}
    </button>
  );
}
