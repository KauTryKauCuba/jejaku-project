"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function RemoteSignOut({
  shouldSignOut,
}: {
  shouldSignOut: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!shouldSignOut) return;
    (async () => {
      await signOut({ redirect: false });
      router.replace("/");
    })();
  }, [shouldSignOut, router]);

  return null;
}
