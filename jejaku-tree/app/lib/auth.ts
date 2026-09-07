import NextAuth from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
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
// Same pattern as jejaku-receipt's copy of this file.
export const { handlers, auth } = NextAuth({
  cookies: sharedCookies,
  providers: [],
  trustHost: true,
  session: { strategy: "jwt" },
  callbacks: {
    // Compares parsed origins, never string prefixes — see
    // jejaku-receipt's copy of this callback for why a prefix check here
    // would be an open redirect.
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      let allowedSiblingOrigin: string | null = null;
      try {
        const configured = process.env.NEXT_PUBLIC_JEJAKU_URL;
        allowedSiblingOrigin = configured ? new URL(configured).origin : null;
      } catch {
        allowedSiblingOrigin = null;
      }

      try {
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
        await db
          .insert(users)
          .values({ email: token.email, fullName: token.dbProfile.fullName })
          .onConflictDoNothing({ target: users.email });

        const existing = await db.query.users.findFirst({
          where: eq(users.email, token.email),
        });
        token.treeProfile = existing
          ? { fullName: existing.fullName, email: existing.email }
          : null;
      } else {
        token.treeProfile = null;
      }

      return token;
    },
    async session({ session, token }) {
      session.otpConfirmed = token.otpConfirmed === true;
      session.dbProfile = (token.dbProfile as SessionProfile | null | undefined) ?? null;
      session.treeProfile = token.treeProfile ?? null;
      return session;
    },
  },
});
