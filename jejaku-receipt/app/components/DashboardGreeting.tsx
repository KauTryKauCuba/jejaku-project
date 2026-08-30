"use client";

import { useProfile } from "../lib/useProfile";

export default function DashboardGreeting() {
  const { profile } = useProfile();
  const firstName = profile?.fullName?.split(" ")[0];

  if (!firstName) return null;

  return (
    <p className="mb-[6px] text-[12px] text-ink-mute">Hey, {firstName}</p>
  );
}
