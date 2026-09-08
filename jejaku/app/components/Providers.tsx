"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { Session } from "next-auth";

function BfcacheRefresh() {
  const router = useRouter();

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  return null;
}

export default function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <BfcacheRefresh />
      {children}
    </SessionProvider>
  );
}
