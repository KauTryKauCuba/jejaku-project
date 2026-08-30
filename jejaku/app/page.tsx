import { redirect } from "next/navigation";
import { auth } from "./lib/auth";
import { isSignedIn } from "./lib/authState";
import HomeContent from "./components/HomeContent";
import RemoteSignOut from "./components/RemoteSignOut";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ signout?: string }>;
}) {
  const params = await searchParams;
  const shouldSignOut = params.signout === "1";

  if (!shouldSignOut) {
    const session = await auth();
    if (isSignedIn(session)) {
      redirect("/dashboard");
    }
  }

  return (
    <>
      <RemoteSignOut shouldSignOut={shouldSignOut} />
      <HomeContent />
    </>
  );
}
