"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { setStoredProfile } from "../lib/session";

export default function SessionHandoff() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const encoded = searchParams.get("profile");

  useEffect(() => {
    if (!encoded) return;
    try {
      setStoredProfile(JSON.parse(atob(decodeURIComponent(encoded))));
    } catch {
      // malformed handoff payload, ignore
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("profile");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [encoded, pathname, router, searchParams]);

  return null;
}
