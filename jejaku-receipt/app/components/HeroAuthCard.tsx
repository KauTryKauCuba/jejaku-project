import { Fingerprint } from "@phosphor-icons/react/dist/ssr";
import GoogleButton from "./GoogleButton";
import EmailOtpForm from "./EmailOtpForm";

export default function HeroAuthCard() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-[23px] text-left sm:p-[30px]">
      <p className="flex items-center gap-[6px] text-[12px] font-medium text-primary-deep">
        <Fingerprint size={15} weight="light" />
        One account, every project
      </p>
      <p className="mt-[8px] text-[13px] leading-relaxed text-ink-mute">
        No password — just a quick code by email.
      </p>

      <div className="mt-[15px]">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="mt-[15px] flex items-center gap-[11px]">
        <div className="h-px flex-1 bg-hairline" />
        <span className="text-[12px] text-ink-mute">or</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <div className="mt-[15px]">
        <EmailOtpForm size="compact" />
      </div>
    </div>
  );
}
