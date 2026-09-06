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
// connect-src must include jejaku-receipt's origin: DefaultCurrencyForm.tsx
// and DeleteAccountCard.tsx both fetch() it directly, cross-origin, from
// the browser (shared session cookie, not a proxy) — without this, CSP
// would silently break the default-currency save and account deletion.
// img-src needs blob:: the avatar picker in OnboardingForm and SettingsForm
// does URL.createObjectURL(file) and hands that blob: URL to AvatarCropModal,
// which passes it to react-easy-crop as an <img> source — and cropImage.ts
// loads the same URL into a canvas. Without blob: the cropper renders
// nothing and the crop itself fails, breaking avatar upload in Settings and
// in the onboarding flow every new user goes through. data: stays for
// Next.js's own inlined images; cdn.simpleicons.org is TechLogo on /privacy.
const receiptOrigin = (process.env.NEXT_PUBLIC_RECEIPT_URL ?? "").replace(/\/+$/, "");

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://cdn.simpleicons.org;
  font-src 'self';
  connect-src 'self'${receiptOrigin ? ` ${receiptOrigin}` : ""};
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
          // includeSubDomains since jejaku-receipt.jejaku.my shares the
          // parent domain's session cookie and should get the same
          // HTTPS-only guarantee.
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
