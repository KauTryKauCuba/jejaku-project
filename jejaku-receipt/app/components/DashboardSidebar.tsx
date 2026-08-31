"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Receipt,
  UploadSimple,
  Gear,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

const NAV_ITEMS: {
  label: string;
  icon: Icon;
  href?: string;
}[] = [
  { label: "Dashboard", icon: SquaresFour, href: "/dashboard" },
  { label: "Receipts", icon: Receipt, href: "/receipts" },
  { label: "Upload", icon: UploadSimple },
  { label: "Settings", icon: Gear, href: "/settings" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full shrink-0 flex-col gap-[3px]">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.href === pathname;

        if (!item.href) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              title={`${item.label} — Coming soon`}
              className="flex min-h-[32px] shrink-0 cursor-not-allowed items-center gap-[8px] rounded-md px-[12px] py-[7px] text-[12px] font-medium text-ink-mute opacity-60"
            >
              <Icon size={16} weight="light" className="shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
              <span className="hidden text-[9px] font-medium uppercase tracking-[0.1px] text-ink-mute lg:inline">
                Soon
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={
              active
                ? "flex min-h-[32px] shrink-0 items-center gap-[8px] rounded-md bg-primary-subdued px-[12px] py-[7px] text-[12px] font-medium text-primary-deep"
                : "flex min-h-[32px] shrink-0 items-center gap-[8px] rounded-md px-[12px] py-[7px] text-[12px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft"
            }
          >
            <Icon size={16} weight="light" className="shrink-0" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
