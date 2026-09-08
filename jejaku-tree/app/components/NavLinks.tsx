import Link from "next/link";
import { jejakuUrl } from "../lib/jejakuUrl";

export const NAV_LINKS = [
  { label: "Changelog", href: jejakuUrl("/changelog") },
];

export function NavLinks({ className }: { className: string }) {
  return (
    <>
      {NAV_LINKS.map((link) => (
        <Link key={link.label} href={link.href} className={className}>
          {link.label}
        </Link>
      ))}
    </>
  );
}
