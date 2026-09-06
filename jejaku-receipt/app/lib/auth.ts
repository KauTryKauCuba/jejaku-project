import NextAuth from "next-auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "../db";
import { users } from "../db/schema";
import { currencyForCountry } from "./countryCurrency";
import type { SessionProfile } from "../types/next-auth";

const cookieDomain = process.env.COOKIE_DOMAIN;

const sharedCookies = cookieDomain
  ? {
      sessionToken: {
        name: "authjs.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax" as const,
          path: "/",
          secure: true,
          domain: cookieDomain,
        },
      },
      csrfToken: {
        name: "authjs.csrf-token",
        options: {
          httpOnly: true,
          sameSite: "lax" as const,
          path: "/",
          secure: true,
          domain: cookieDomain,
        },
      },
      callbackUrl: {
        name: "authjs.callback-url",
        options: {
          httpOnly: true,
          sameSite: "lax" as const,
          path: "/",
          secure: true,
          domain: cookieDomain,
        },
      },
    }
  : undefined;

// This app never signs anyone in itself — identity always comes from the
// sibling "jejaku" app via the shared session cookie above. No providers
// are configured; auth() here only ever decodes a token jejaku issued.
export const { handlers, auth } = NextAuth({
  cookies: sharedCookies,
  providers: [],
  trustHost: true,
  session: { strategy: "jwt" },
  callbacks: {
    // Compares parsed origins, never string prefixes. `url.startsWith(
    // jejakuOrigin)` was an open redirect: with NEXT_PUBLIC_JEJAKU_URL set
    // to "https://jejaku.my" (no trailing slash, as .env.example has it),
    // "https://jejaku.my.evil.com/phishing" also starts with it, so an
    // attacker-supplied callbackUrl could send a user straight off-site
    // after sign-in/sign-out. Parsing to an origin makes the sibling-app
    // allowance exact instead of prefix-shaped.
    async redirect({ url, baseUrl }) {
      // Relative paths are always same-origin by construction.
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      let allowedSiblingOrigin: string | null = null;
      try {
        const configured = process.env.NEXT_PUBLIC_JEJAKU_URL;
        allowedSiblingOrigin = configured ? new URL(configured).origin : null;
      } catch {
        allowedSiblingOrigin = null;
      }

      try {
        // Also guards the previously-unguarded `new URL(url)` below it —
        // a malformed url would have thrown straight out of this callback.
        const { origin } = new URL(url);
        if (origin === baseUrl) return url;
        if (allowedSiblingOrigin && origin === allowedSiblingOrigin) return url;
      } catch {
        // Not a parseable absolute URL — fall through to baseUrl.
      }

      return baseUrl;
    },
    async jwt({ token }) {
      // token already carries whatever jejaku's own jwt callback wrote
      // (otpConfirmed, dbProfile, email, ...) — decoded from the shared cookie.
      if (token.otpConfirmed && token.dbProfile && token.email) {
        // Cloudflare (this site is proxied through it) sets this header
        // with the visitor's country on every request — free geolocation,
        // no external API call. Only matters on first insert: existing
        // rows are untouched (onConflictDoNothing), and locally (no
        // Cloudflare) it's just absent, falling back to the schema
        // default of USD.
        const countryCode = (await headers()).get("cf-ipcountry");
        const defaultCurrency = currencyForCountry(countryCode);

        await db
          .insert(users)
          .values({ email: token.email, fullName: token.dbProfile.fullName, defaultCurrency })
          .onConflictDoNothing({ target: users.email });

        const existing = await db.query.users.findFirst({
          where: eq(users.email, token.email),
        });
        token.receiptProfile = existing
          ? { fullName: existing.fullName, email: existing.email }
          : null;
      } else {
        token.receiptProfile = null;
      }

      return token;
    },
    async session({ session, token }) {
      session.otpConfirmed = token.otpConfirmed === true;
      session.dbProfile = (token.dbProfile as SessionProfile | null | undefined) ?? null;
      session.receiptProfile = token.receiptProfile ?? null;
      return session;
    },
  },
});
