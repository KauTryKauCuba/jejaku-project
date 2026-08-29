"use client";

import { useEffect, useState } from "react";
import { Clock } from "@phosphor-icons/react";

function formatNow(date: Date) {
  const day = date.toLocaleDateString(undefined, { weekday: "long" });
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return `${day}, ${time}`;
}

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
      <span className="tabular">{formatNow(now)}</span>
    </span>
  );
}
