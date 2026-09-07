import { redirect } from "next/navigation";
import { jejakuUrl } from "../lib/jejakuUrl";

export default function RegisterPage() {
  redirect(jejakuUrl("/login"));
}
