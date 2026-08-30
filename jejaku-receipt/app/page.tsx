import { redirect } from "next/navigation";
import { auth } from "./lib/auth";
import HomeContent from "./components/HomeContent";

export default async function Home() {
  const session = await auth();
  if (session?.otpConfirmed && session.dbProfile) {
    redirect("/dashboard");
  }

  return <HomeContent />;
}
