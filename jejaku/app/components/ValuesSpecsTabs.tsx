"use client";

import { useState, type ReactNode } from "react";

type TabId = "values" | "specs" | "stack";

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

  return (
    <div>
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
