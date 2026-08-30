import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";
import { isSignedIn } from "../lib/authState";
import HomeContent from "../components/HomeContent";

export const metadata: Metadata = {
  title: "Dashboard — Jejaku",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!isSignedIn(session)) {
    redirect("/");
  }

  return <HomeContent variant="dashboard" />;
}
