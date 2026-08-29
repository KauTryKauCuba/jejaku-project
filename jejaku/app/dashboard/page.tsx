import type { Metadata } from "next";
import HomeContent from "../components/HomeContent";
import SessionRedirect from "../components/SessionRedirect";

export const metadata: Metadata = {
  title: "Dashboard — Jejaku",
};

export default function DashboardPage() {
  return (
    <>
      <SessionRedirect to="/" when="signed-out" />
      <HomeContent variant="dashboard" />
    </>
  );
}
