"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import GoogleAuthGuard from "./GoogleAuthGuard";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <GoogleAuthGuard />
      {children}
    </SessionProvider>
  );
}
