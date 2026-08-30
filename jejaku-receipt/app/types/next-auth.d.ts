import type { DefaultSession } from "next-auth";

// Mirrors jejaku's own SessionProfile shape — this app only ever decodes
// a session cookie jejaku issued, so the shape must match exactly.
export type SessionProfile = {
  fullName: string;
  avatarUrl?: string;
  email: string;
  registeredAt: string;
};

export type ReceiptProfile = {
  fullName: string;
  email: string;
};

declare module "next-auth" {
  interface Session extends DefaultSession {
    otpConfirmed: boolean;
    dbProfile: SessionProfile | null;
    receiptProfile: ReceiptProfile | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    otpConfirmed?: boolean;
    dbProfile?: SessionProfile | null;
    receiptProfile?: ReceiptProfile | null;
  }
}

declare module "@auth/core/types" {
  interface Session extends DefaultSession {
    otpConfirmed: boolean;
    dbProfile: SessionProfile | null;
    receiptProfile: ReceiptProfile | null;
  }
}
