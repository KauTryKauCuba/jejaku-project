"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredProfile } from "../lib/session";

export default function SessionRedirect({
  to,
  when,
}: {
  to: string;
  when: "signed-in" | "signed-out";
}) {
  const router = useRouter();

  useEffect(() => {
    const signedIn = getStoredProfile() !== null;
    const shouldRedirect = when === "signed-in" ? signedIn : !signedIn;
    if (shouldRedirect) {
      router.replace(to);
    }
  }, [when, to, router]);

  return null;
}
