"use client";

import { useSession } from "next-auth/react";

export function useProfile() {
  const { data: session, status } = useSession();
  const otpConfirmed = session?.otpConfirmed === true;
  const profile = otpConfirmed ? session?.dbProfile ?? null : null;

  return {
    status,
    otpConfirmed,
    profile,
    loggedIn: status === "authenticated" && otpConfirmed && profile !== null,
  };
}
