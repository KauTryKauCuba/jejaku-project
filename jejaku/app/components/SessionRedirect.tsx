"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "../lib/useProfile";

export default function SessionRedirect({
  to,
  when,
}: {
  to: string;
  when: "signed-in" | "signed-out";
}) {
  const router = useRouter();
  const { status, loggedIn } = useProfile();

  useEffect(() => {
    if (status === "loading") return;
    const shouldRedirect = when === "signed-in" ? loggedIn : !loggedIn;
    if (shouldRedirect) {
      router.replace(to);
    }
  }, [status, loggedIn, when, to, router]);

  return null;
}
