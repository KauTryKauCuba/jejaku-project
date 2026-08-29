import HomeContent from "./components/HomeContent";
import SessionRedirect from "./components/SessionRedirect";
import RemoteSignOut from "./components/RemoteSignOut";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ signout?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <RemoteSignOut shouldSignOut={params.signout === "1"} />
      <SessionRedirect to="/dashboard" when="signed-in" />
      <HomeContent />
    </>
  );
}
