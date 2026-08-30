import type { Session } from "next-auth";

export function isSignedIn(session: Session | null): boolean {
  return !!session?.otpConfirmed && !!session.dbProfile;
}
