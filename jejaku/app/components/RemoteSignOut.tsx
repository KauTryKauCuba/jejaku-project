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
    console.log("[RemoteSignOut] effect1", { shouldSignOut, alreadyFetched: fetchedRef.current });
    if (!shouldSignOut || fetchedRef.current) return;
    fetchedRef.current = true;
    getCsrfToken().then((token) => {
      console.log("[RemoteSignOut] csrf token resolved:", token);
      if (token) {
        setCsrfToken(token);
      } else {
        console.log("[RemoteSignOut] no token, falling back to signOut()");
        signOut({ redirect: true, callbackUrl: "/" });
      }
    });
  }, [shouldSignOut]);

  useEffect(() => {
    console.log("[RemoteSignOut] effect2", { csrfToken, formPresent: !!formRef.current });
    if (!csrfToken) return;
    if (typeof BroadcastChannel !== "undefined") {
      new BroadcastChannel("next-auth").postMessage({
        event: "session",
        data: { trigger: "signout" },
      });
    }
    if (formRef.current) {
      console.log("[RemoteSignOut] submitting form now");
      if (typeof formRef.current.requestSubmit === "function") {
        formRef.current.requestSubmit();
      } else {
        formRef.current.submit();
      }
    } else {
      console.log("[RemoteSignOut] formRef.current is null, cannot submit!");
    }
  }, [csrfToken]);

  if (!shouldSignOut) return null;

  return (
    <form ref={formRef} action="/api/auth/signout" method="POST" style={{ display: "none" }}>
      <input type="hidden" name="csrfToken" value={csrfToken ?? ""} />
      <input type="hidden" name="callbackUrl" value="/" />
    </form>
  );
}
