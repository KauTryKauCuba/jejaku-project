import type { Metadata } from "next";
import AuthCard from "../components/AuthCard";
import GoogleButton from "../components/GoogleButton";
import GithubButton from "../components/GithubButton";
import DiscordButton from "../components/DiscordButton";
import EmailOtpForm from "../components/EmailOtpForm";

export const metadata: Metadata = {
  title: "Sign in — Jejaku",
  description: "Sign in or create your Jejaku account.",
};

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="One account, every project"
      title="Sign in to Jejaku"
      subtitle="No password — just a quick code by email."
      footer="New here? Same steps, we'll set you up."
    >
      <div className="flex flex-col gap-2">
        <GoogleButton label="Continue with Google" />
        <GithubButton label="Continue with GitHub" />
        <DiscordButton label="Continue with Discord" />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-hairline" />
        <span className="text-[13px] text-ink-mute">or</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <EmailOtpForm />
    </AuthCard>
  );
}
