import type { DefaultSession } from "next-auth";

export type SessionProfile = {
  fullName: string;
  avatarUrl?: string;
  email: string;
  registeredAt: string;
  lastSignInAt?: string;
};

declare module "@auth/core/types" {
  interface Session extends DefaultSession {
    otpConfirmed: boolean;
    dbProfile: SessionProfile | null;
    lastSignInAt?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    otpConfirmed?: boolean;
    dbProfile?: SessionProfile | null;
    lastSignInAt?: string;
  }
}
