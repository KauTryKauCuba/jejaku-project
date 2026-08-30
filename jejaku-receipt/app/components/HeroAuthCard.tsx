import Link from "next/link";
import { Fingerprint } from "@phosphor-icons/react/dist/ssr";
import { jejakuUrl } from "../lib/jejakuUrl";

export default function HeroAuthCard() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-[23px] text-left sm:p-[30px]">
      <p className="flex items-center gap-[6px] text-[12px] font-medium text-primary-deep">
        <Fingerprint size={15} weight="light" />
        One account, every project
      </p>
      <p className="mt-[8px] text-[13px] leading-relaxed text-ink-mute">
        Sign in once on jejaku — it works here too.
      </p>

      <div className="mt-[15px]">
        <Link
          href={jejakuUrl("/login")}
          className="flex h-[37px] w-full items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98]"
        >
          Sign in on jejaku
        </Link>
      </div>
    </div>
  );
}
