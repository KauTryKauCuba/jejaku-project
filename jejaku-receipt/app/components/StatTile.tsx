import type { Icon } from "@phosphor-icons/react";
import IconFlowBadge from "./IconFlowBadge";

export default function StatTile({
  icon: Icon,
  label,
  value,
  detail,
  seed,
}: {
  icon: Icon;
  label: string;
  value: string;
  detail: string;
  seed: number;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas p-[16px]">
      <IconFlowBadge size={40} seed={seed}>
        <Icon size={16} weight="light" />
      </IconFlowBadge>
      <p className="mt-[12px] text-[10px] font-medium uppercase tracking-[0.1px] text-ink-mute">
        {label}
      </p>
      <p className="mt-[3px] text-[15px] font-light tracking-[-0.16px] text-ink">
        {value}
      </p>
      <p className="mt-[3px] text-[11px] leading-relaxed text-ink-mute">
        {detail}
      </p>
    </div>
  );
}
