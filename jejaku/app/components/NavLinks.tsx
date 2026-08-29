import Link from "next/link";

export const NAV_LINKS = [{ label: "Roadmap", href: "/roadmap" }];

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
