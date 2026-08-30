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
    console.log("[RemoteSignOut] mount", { shouldSignOut, alreadyFired: firedRef.current });
    if (!shouldSignOut || firedRef.current) return;
    firedRef.current = true;

    (async () => {
      try {
        console.log("[RemoteSignOut] fetching csrf token...");
        const csrfToken = await getCsrfToken();
        console.log("[RemoteSignOut] csrf token:", csrfToken);

        if (typeof BroadcastChannel !== "undefined") {
          new BroadcastChannel("next-auth").postMessage({
            event: "session",
            data: { trigger: "signout" },
          });
        }

        console.log("[RemoteSignOut] posting to /api/auth/signout...");
        const res = await fetch("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ csrfToken: csrfToken ?? "", callbackUrl: "/" }),
        });
        console.log("[RemoteSignOut] signout response status:", res.status);
        const sessionCheck = await fetch("/api/auth/session").then((r) => r.json());
        console.log("[RemoteSignOut] session after signout call:", sessionCheck);

        console.log("[RemoteSignOut] navigating to /");
        window.location.href = "/";
      } catch (err) {
        console.error("[RemoteSignOut] ERROR:", err);
      }
    })();
  }, [shouldSignOut]);

  return null;
}
