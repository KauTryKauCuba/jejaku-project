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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Auth.js redirects failed sign-ins here (see `pages.error` in
  // lib/auth.ts) instead of its own built-in error page, which has
  // crashed outright on this VPS's flaky network rather than showing its
  // intended message. One generic message covers every error code here —
  // the actual cause (an OAuth provider fetch failing) isn't something
  // the user can act on beyond "try again," so a specific code wouldn't
  // help them.
  const { error } = await searchParams;

  return (
    <AuthCard
      eyebrow="One account, every project"
      title="Sign in to Jejaku"
      subtitle="No password — just a quick code by email."
      footer="New here? Same steps, we'll set you up."
    >
      {error && (
        <p className="mb-6 rounded-md border border-error/30 bg-error/10 px-4 py-3 text-[14px] leading-relaxed text-error">
          Sign-in didn&apos;t go through — this can happen from a brief network hiccup. Please try again.
        </p>
      )}
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
