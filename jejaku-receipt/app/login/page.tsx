import type { Metadata } from "next";
import AuthCard from "../components/AuthCard";
import GoogleButton from "../components/GoogleButton";
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
      <GoogleButton label="Continue with Google" />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-hairline" />
        <span className="text-[13px] text-ink-mute">or</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <EmailOtpForm />
    </AuthCard>
  );
}
