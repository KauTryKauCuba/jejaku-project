"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearStoredProfile } from "../lib/session";

export default function RemoteSignOut({
  shouldSignOut,
}: {
  shouldSignOut: boolean;
}) {
  const router = useRouter();

  if (shouldSignOut && typeof window !== "undefined") {
    clearStoredProfile();
  }

  useEffect(() => {
    if (shouldSignOut) router.replace("/");
  }, [shouldSignOut, router]);

  return null;
}
