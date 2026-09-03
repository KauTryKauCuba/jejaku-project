import Image from "next/image";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { jejakuUrl } from "../lib/jejakuUrl";

export default function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas py-[61px]">
      <div className="mx-auto max-w-6xl px-[23px]">
        <div className="flex flex-col items-start justify-between gap-[30px] md:flex-row md:items-center">
          <Link href="/" className="flex items-center gap-[8px]">
            <Image src="/jk-logo.svg" alt="" width={22} height={22} />
            <span className="text-[14px] font-semibold tracking-tight text-primary-soft">
              jejaku
            </span>
          </Link>
          <div className="flex gap-[30px]">
            <NavLinks className="text-[12px] text-ink-mute hover:text-ink" />
            <Link href={jejakuUrl("/terms")} className="text-[12px] text-ink-mute hover:text-ink">
              Terms
            </Link>
            <Link href={jejakuUrl("/privacy")} className="text-[12px] text-ink-mute hover:text-ink">
              Privacy
            </Link>
          </div>
        </div>
        <p className="mt-[38px] text-[12px] text-ink-mute">
          © 2026 Jejaku. Built to learn, shared for free.
        </p>
      </div>
    </footer>
  );
}
