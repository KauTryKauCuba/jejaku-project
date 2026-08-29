import type { ReactNode } from "react";
import Link from "next/link";
import { Fingerprint } from "@phosphor-icons/react/dist/ssr";

export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="gradient-mesh flex min-h-[100dvh] items-center justify-center px-6 py-16">
      <div className="mesh-blob" aria-hidden="true" />
      <div className="w-full max-w-md rounded-lg border border-hairline bg-canvas p-8 shadow-[0_8px_24px_rgba(29,78,216,0.1),0_2px_6px_rgba(29,78,216,0.05)] sm:p-10">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-ink"
        >
          jejaku
        </Link>

        <p className="mt-8 flex items-center gap-[6px] text-[13px] font-medium text-primary-deep">
          <Fingerprint size={16} weight="light" />
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[26px] font-light leading-[1.12] tracking-[-0.26px] text-ink">
          {title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-mute">
          {subtitle}
        </p>

        <div className="mt-8">{children}</div>

        <p className="mt-8 text-center text-[14px] text-ink-mute">
          {footer}
        </p>
      </div>
    </div>
  );
}
