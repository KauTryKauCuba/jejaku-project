"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type TabId = "values" | "specs" | "stack";

const TAB_ORDER: TabId[] = ["values", "specs", "stack"];
const ADVANCE_THRESHOLD = 120;
const COOLDOWN_MS = 350;

export default function ValuesSpecsTabs({
  valuesContent,
  specsContent,
  stackContent,
}: {
  valuesContent: ReactNode;
  specsContent: ReactNode;
  stackContent: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("values");
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef(tab);
  const lockedRef = useRef(false);
  const cooldownRef = useRef(false);
  const accumRef = useRef(0);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "values", label: "The Mind" },
    { id: "specs", label: "The Hardware" },
    { id: "stack", label: "The Tech Stack" },
  ];

  const content = {
    values: valuesContent,
    specs: specsContent,
    stack: stackContent,
  }[tab];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isNearCenter = () => {
      const rect = el.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const sectionCenter = rect.top + rect.height / 2;
      return Math.abs(sectionCenter - viewportCenter) < rect.height / 2;
    };

    const advance = (goingDown: boolean) => {
      const currentIndex = TAB_ORDER.indexOf(tabRef.current);
      const nextIndex = goingDown ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) {
        lockedRef.current = false;
        return;
      }
      setTab(TAB_ORDER[nextIndex]);
      accumRef.current = 0;
      cooldownRef.current = true;
      window.setTimeout(() => {
        cooldownRef.current = false;
      }, COOLDOWN_MS);
    };

    const onWheel = (e: WheelEvent) => {
      const goingDown = e.deltaY > 0;
      const currentIndex = TAB_ORDER.indexOf(tabRef.current);

      if (lockedRef.current) {
        e.preventDefault();
        if (cooldownRef.current) return;

        accumRef.current += e.deltaY;
        if (Math.abs(accumRef.current) >= ADVANCE_THRESHOLD) {
          advance(accumRef.current > 0);
        }
        return;
      }

      if (!isNearCenter()) return;

      const canAdvance = goingDown
        ? currentIndex < TAB_ORDER.length - 1
        : currentIndex > 0;
      if (!canAdvance) return;

      lockedRef.current = true;
      accumRef.current = 0;
      e.preventDefault();
      advance(goingDown);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={containerRef}>
      <div className="mx-auto flex w-fit flex-wrap gap-[4px] rounded-pill bg-canvas-soft p-[4px]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "rounded-pill bg-primary px-[19px] py-[8px] text-[14px] font-medium text-on-primary transition-colors"
                : "rounded-pill px-[19px] py-[8px] text-[14px] font-medium text-ink-mute transition-colors"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="mt-[46px] animate-[tab-fade-in_0.25s_ease-out]">
        {content}
      </div>
    </div>
  );
}
