"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getStoredProfile } from "../lib/session";

const PROTECTED_PATHS = ["/dashboard"];

export default function GoogleAuthGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;
    if (!PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    const existing = getStoredProfile();
    if (existing?.email === session.user.email) return;
    router.replace("/");
  }, [status, session, pathname, router]);

  return null;
}
