"use client";

import { useEffect, useRef, useState } from "react";
import { getCsrfToken, signOut } from "next-auth/react";

export default function RemoteSignOut({
  shouldSignOut,
}: {
  shouldSignOut: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fetchedRef = useRef(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldSignOut || fetchedRef.current) return;
    fetchedRef.current = true;
    getCsrfToken().then((token) => {
      if (token) {
        setCsrfToken(token);
      } else {
        // Fall back to next-auth's own signOut(), which has its own CSRF handling
        // and will still navigate away even if something above failed.
        signOut({ redirect: true, callbackUrl: "/" });
      }
    });
  }, [shouldSignOut]);

  useEffect(() => {
    if (!csrfToken) return;
    // next-auth's signOut() normally broadcasts this so other open tabs clear
    // their session immediately; replicate it since we bypass signOut() here.
    if (typeof BroadcastChannel !== "undefined") {
      new BroadcastChannel("next-auth").postMessage({
        event: "session",
        data: { trigger: "signout" },
      });
    }
    formRef.current?.submit();
  }, [csrfToken]);

  if (!shouldSignOut) return null;

  return (
    <form ref={formRef} action="/api/auth/signout" method="POST" style={{ display: "none" }}>
      <input type="hidden" name="csrfToken" value={csrfToken ?? ""} />
      <input type="hidden" name="callbackUrl" value="/" />
    </form>
  );
}
