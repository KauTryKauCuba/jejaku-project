"use client";

import { useEffect, useRef } from "react";
import { getCsrfToken } from "next-auth/react";

export default function RemoteSignOut({
  shouldSignOut,
}: {
  shouldSignOut: boolean;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!shouldSignOut || firedRef.current) return;
    firedRef.current = true;

    (async () => {
      const csrfToken = await getCsrfToken();

      if (typeof BroadcastChannel !== "undefined") {
        new BroadcastChannel("next-auth").postMessage({
          event: "session",
          data: { trigger: "signout" },
        });
      }

      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken: csrfToken ?? "", callbackUrl: "/" }),
      });

      window.location.href = "/";
    })();
  }, [shouldSignOut]);

  return null;
}
