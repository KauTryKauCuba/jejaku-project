import LiveClock from "./LiveClock";
import LogoLink from "./LogoLink";
import { NavLinks } from "./NavLinks";
import UserBadge from "./UserBadge";

export default function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-[23px] py-[19px] lg:px-[30px]">
      <LogoLink />
      <nav className="flex items-center gap-[16px] sm:gap-[30px]">
        <NavLinks className="text-[14px] text-ink-secondary transition-colors hover:text-ink" />
        <span className="hidden md:block">
          <LiveClock />
        </span>
        <UserBadge />
      </nav>
    </header>
  );
}
