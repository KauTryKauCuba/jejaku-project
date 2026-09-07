import Link from "next/link";

// Empty for now — jejaku-receipt's copy of this file links to jejaku's
// Changelog, but that changelog doesn't cover this app yet. Add entries
// here (same shape) once there's somewhere real to point to.
export const NAV_LINKS: { label: string; href: string }[] = [];

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
