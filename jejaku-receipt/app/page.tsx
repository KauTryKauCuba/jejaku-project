import HomeContent from "./components/HomeContent";
import SessionRedirect from "./components/SessionRedirect";

export default function Home() {
  return (
    <>
      <SessionRedirect to="/dashboard" when="signed-in" />
      <HomeContent />
    </>
  );
}
