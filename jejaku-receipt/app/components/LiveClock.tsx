"use client";

import { useEffect, useState } from "react";
import { Clock } from "@phosphor-icons/react";
import { formatIsoDateTime } from "../lib/formatIso";

export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <span className="flex items-center gap-[6px] text-[14px] text-ink-secondary">
      <Clock size={15} weight="light" />
      <span className="tabular">{formatIsoDateTime(now)}</span>
    </span>
  );
}
