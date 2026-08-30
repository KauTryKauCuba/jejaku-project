import { redirect } from "next/navigation";
import { auth } from "./lib/auth";
import { isSignedIn } from "./lib/authState";
import HomeContent from "./components/HomeContent";

export default async function Home() {
  const session = await auth();
  if (isSignedIn(session)) {
    redirect("/dashboard");
  }

  return <HomeContent />;
}
