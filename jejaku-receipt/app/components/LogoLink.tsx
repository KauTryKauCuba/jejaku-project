"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LogoLink() {
  const pathname = usePathname();
  const onDashboard = pathname?.startsWith("/dashboard");

  return (
    <Link
      href={onDashboard ? `${process.env.NEXT_PUBLIC_JEJAKU_URL}/dashboard` : "/"}
      className="flex items-center gap-[8px]"
    >
      <Image src="/jk-logo.svg" alt="" width={28} height={28} priority />
      <span className="whitespace-nowrap text-[17px] font-semibold tracking-tight text-primary-soft">
        jejaku receipt
      </span>
    </Link>
  );
}
