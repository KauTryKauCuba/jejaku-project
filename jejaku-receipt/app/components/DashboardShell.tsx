"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import LiveClock from "./LiveClock";
import UserBadge from "./UserBadge";
import DashboardSidebar from "./DashboardSidebar";
import { NavLinks } from "./NavLinks";
import FlowLines from "./FlowLines";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-canvas-soft">
      <div className="relative border-b border-hairline">
        <div
          className="gradient-mesh"
          style={{ position: "absolute", inset: 0 }}
          aria-hidden="true"
        >
          <div className="mesh-blob" aria-hidden="true" />
          <FlowLines />
        </div>

        <header className="relative flex items-center justify-between px-[23px] py-[19px]">
          <Link
            href="http://localhost:3000/dashboard"
            className="flex items-center gap-[8px]"
          >
            <Image src="/jk-logo.svg" alt="" width={28} height={28} priority />
            <span className="whitespace-nowrap text-[17px] font-semibold tracking-tight text-primary-soft">
              jejaku receipt
            </span>
          </Link>

          <div className="flex items-center gap-[16px] sm:gap-[23px]">
            <NavLinks className="hidden text-[14px] text-ink-secondary transition-colors hover:text-ink sm:inline" />
            <span className="hidden md:block">
              <LiveClock />
            </span>
            <UserBadge />
          </div>
        </header>
      </div>

      <div className="flex">
        <aside className="min-h-[calc(100dvh-66px)] w-[64px] shrink-0 border-r border-hairline bg-canvas lg:w-[176px]">
          <div className="px-[12px] py-[15px]">
            <DashboardSidebar />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-[18px] py-[24px] lg:px-[20px] lg:py-[20px]">
          {children}
        </main>
      </div>
    </div>
  );
}
