import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Static (non-nonce) CSP, per Next.js's own "Without Nonces" guidance
// (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md)
// — same approach as jejaku-receipt's copy of this file, see there for the
// full rationale. 'unsafe-inline' on script/style is the documented
// trade-off for keeping normal rendering rather than forcing every page
// into dynamic rendering; this app has no <script> tags or
// dangerouslySetInnerHTML, so the real XSS protection here comes from
// default-src/object-src/base-uri/frame-ancestors, not script-src.
//
// img-src needs jejaku's origin — a user's avatarUrl is usually an
// absolute jejaku-hosted URL (see jejaku's lib/uploads.ts), and
// UserBadge/MemberCard here display it. No data:/blob: here (unlike
// jejaku-receipt) — nothing in this app generates an in-memory image yet;
// add them back if/when something does.
//
// connect-src stays 'self' only: nothing here fetches jejaku's origin
// cross-origin from the browser (the shared session works via cookie
// domain, not a client-side cross-app call).
const jejakuOrigin = (process.env.NEXT_PUBLIC_JEJAKU_URL ?? "").replace(/\/+$/, "");

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://*.googleusercontent.com https://avatars.githubusercontent.com https://cdn.discordapp.com${jejakuOrigin ? ` ${jejakuOrigin}` : ""};
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
