"use client";

import Image from "next/image";
import Link from "next/link";
import { useProfile } from "../lib/useProfile";

export default function LogoLink() {
  const { profile } = useProfile();

  return (
    <Link
      href={profile ? "/dashboard" : "/"}
      prefetch={false}
      className="flex items-center gap-[8px]"
    >
      <Image src="/jk-logo.svg" alt="" width={28} height={28} priority />
      <span className="whitespace-nowrap text-[17px] font-semibold tracking-tight text-primary-soft">
        jejaku
      </span>
    </Link>
  );
}
