import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "../db";
import { users } from "../db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      await db
        .insert(users)
        .values({
          email: user.email,
          fullName: user.name ?? user.email,
          avatarUrl: user.image ?? null,
        })
        .onConflictDoNothing({ target: users.email });
      return true;
    },
  },
});
