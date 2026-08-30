import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { verifyOtp } from "./otp";
import type { SessionProfile } from "../types/next-auth";

class OtpExpiredError extends CredentialsSignin {
  code = "otp_expired";
}
class OtpInvalidError extends CredentialsSignin {
  code = "otp_invalid";
}
class OtpTooManyAttemptsError extends CredentialsSignin {
  code = "otp_too_many_attempts";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
    Credentials({
      id: "otp",
      name: "Email code",
      credentials: { email: {}, code: {} },
      async authorize(credentials) {
        const email = credentials?.email;
        const code = credentials?.code;
        if (typeof email !== "string" || typeof code !== "string") {
          throw new OtpInvalidError();
        }

        const result = await verifyOtp(email, code);
        if (!result.ok) {
          if (result.reason === "expired") throw new OtpExpiredError();
          if (result.reason === "too_many_attempts") throw new OtpTooManyAttemptsError();
          throw new OtpInvalidError();
        }

        await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.email, email));
        return { id: email, email };
      },
    }),
  ],
  trustHost: true,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      return !!user.email;
    },
    async jwt({ token, account, trigger }) {
      if (account?.provider === "google") token.otpConfirmed = false;
      if (account?.provider === "otp") token.otpConfirmed = true;

      if ((account || trigger === "update") && token.email) {
        const existing = await db.query.users.findFirst({
          where: eq(users.email, token.email),
        });
        const dbProfile: SessionProfile | null = existing
          ? {
              fullName: existing.fullName,
              avatarUrl: existing.avatarUrl ?? undefined,
              email: existing.email,
              registeredAt: existing.createdAt.toISOString(),
            }
          : null;
        token.dbProfile = dbProfile;
        token.lastSignInAt = existing?.lastSignInAt
          ? existing.lastSignInAt.toISOString()
          : undefined;
      }

      return token;
    },
    async session({ session, token }) {
      session.otpConfirmed = token.otpConfirmed === true;
      session.dbProfile = token.dbProfile ?? null;
      session.lastSignInAt = token.lastSignInAt;
      return session;
    },
  },
});
