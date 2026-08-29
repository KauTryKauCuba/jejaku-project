"use client";

import { useStoredProfile } from "../lib/session";

export default function DashboardGreeting() {
  const profile = useStoredProfile();
  const firstName = profile?.fullName?.split(" ")[0];

  if (!firstName) return null;

  return (
    <p className="mb-[6px] text-[12px] text-ink-mute">Hey, {firstName}</p>
  );
}
