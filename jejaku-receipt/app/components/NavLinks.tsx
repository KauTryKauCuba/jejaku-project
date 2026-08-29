import Link from "next/link";

export const NAV_LINKS = [
  { label: "Roadmap", href: `${process.env.NEXT_PUBLIC_JEJAKU_URL}/roadmap` },
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
