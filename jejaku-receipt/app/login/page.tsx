import { redirect } from "next/navigation";
import { jejakuUrl } from "../lib/jejakuUrl";

export default function LoginPage() {
  redirect(jejakuUrl("/login"));
}
