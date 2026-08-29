"use client";

import Image from "next/image";
import Link from "next/link";
import { useStoredProfile } from "../lib/session";

export default function LogoLink() {
  const profile = useStoredProfile();

  return (
    <Link
      href={profile ? "/dashboard" : "/"}
      className="flex items-center gap-[8px]"
    >
      <Image src="/jk-logo.svg" alt="" width={28} height={28} priority />
      <span className="whitespace-nowrap text-[17px] font-semibold tracking-tight text-primary-soft">
        jejaku
      </span>
    </Link>
  );
}
