import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Static (non-nonce) CSP, per Next.js's own "Without Nonces" guidance
// (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md)
// — a nonce-based policy requires forcing every page into dynamic
// rendering (no static optimization/ISR, no CDN caching), which is a much
// bigger change than "add security headers" and not something to opt into
// silently. 'unsafe-inline' on script/style is the documented trade-off
// for keeping normal rendering: this app has no <script> tags or
// dangerouslySetInnerHTML at all (checked), so the real XSS protection
// here comes from default-src/object-src/base-uri/frame-ancestors, not
// from script-src being maximally strict.
//
// img-src needs data: (CameraCapture's toDataURL freeze-frame preview) and
// blob: (ReceiptScannerCard's URL.createObjectURL for an imported photo
// preview) — both real, checked usages, not defensive over-allowance.
//
// It also needs jejaku's origin: a user's avatarUrl is *usually* an
// absolute jejaku-hosted URL (see jejaku's lib/uploads.ts), and
// UserBadge/MemberCard here display it. Without this the browser blocks
// every avatar on this app — which is exactly what the first version of
// this policy did.
//
// Same OAuth-provider CDN hosts as jejaku's next.config.ts, for the same
// reason: jejaku's OnboardingForm can save avatarUrl as the raw Google/
// GitHub/Discord profile picture URL rather than a jejaku-hosted one (only
// changed if the user actively crops a new photo), and this app renders
// that same avatarUrl value from the shared DB. Hit in production
// 2026-09-06 — see jejaku's next.config.ts for the full story.
//
// connect-src stays 'self' only: unlike jejaku, nothing here fetches
// jejaku's origin cross-origin from the browser (the shared session works
// via cookie domain, not a client-side cross-app call).
const jejakuOrigin = (process.env.NEXT_PUBLIC_JEJAKU_URL ?? "").replace(/\/+$/, "");

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.googleusercontent.com https://avatars.githubusercontent.com https://cdn.discordapp.com${jejakuOrigin ? ` ${jejakuOrigin}` : ""};
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          // Belt-and-suspenders alongside frame-ancestors above — older
          // browsers that predate CSP's frame-ancestors only respect this.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only takes effect over HTTPS (browsers ignore it over plain
          // HTTP, so this is harmless in local dev) — 2 years,
          // includeSubDomains to match jejaku's own HSTS header since both
          // share the .jejaku.my session cookie domain.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
