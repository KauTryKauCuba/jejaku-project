import type { ReactNode } from "react";

export default function IconFlowBadge({
  children,
  size = 30,
}: {
  children: ReactNode;
  size?: number;
  seed?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center rounded-md text-primary-deep"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, #eef0f1 0%, #f6f7f8 35%, #e3e6e8 70%, #edeff0 100%)",
      }}
    >
      <span className="relative flex items-center justify-center text-primary-deep">
        {children}
      </span>
    </div>
  );
}
