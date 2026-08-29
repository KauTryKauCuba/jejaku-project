function sparklePath(cx: number, cy: number, r: number) {
  const k = r * 0.3;
  return `M${cx} ${cy - r}L${cx + k} ${cy - k}L${cx + r} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + r}L${cx - k} ${cy + k}L${cx - r} ${cy}L${cx - k} ${cy - k}Z`;
}

const SPARKLES = [
  { cx: 20, cy: 20, r: 3, opacity: 0.7, dur: 2.4, delay: 0.2 },
  { cx: 130, cy: 18, r: 3.5, opacity: 0.85, dur: 2.8, delay: 0.9 },
  { cx: 15, cy: 100, r: 3, opacity: 0.6, dur: 2.2, delay: 0.5 },
  { cx: 60, cy: 108, r: 3, opacity: 0.7, dur: 2.6, delay: 1.1 },
];

const NODES = [
  { cx: 75, cy: 16, r: 7, fill: "#00594c" }, // root
  { cx: 45, cy: 52, r: 6, fill: "#ffffff" }, // child 1
  { cx: 105, cy: 52, r: 6, fill: "#ffffff" }, // child 2
  { cx: 25, cy: 92, r: 5.5, fill: "#ffffff" }, // grandchild 1
  { cx: 65, cy: 92, r: 5.5, fill: "#ffffff" }, // grandchild 2
  { cx: 90, cy: 92, r: 5.5, fill: "#ffffff" }, // grandchild 3
];

const NEW_NODE = { cx: 128, cy: 92, r: 5.5 };

const LINES = [
  { x1: 75, y1: 23, x2: 45, y2: 46 },
  { x1: 75, y1: 23, x2: 105, y2: 46 },
  { x1: 45, y1: 58, x2: 25, y2: 86 },
  { x1: 45, y1: 58, x2: 65, y2: 86 },
  { x1: 105, y1: 58, x2: 90, y2: 86 },
];

export default function TreeIllustration() {
  return (
    <div className="flex h-[140px] w-full items-center justify-center overflow-hidden rounded-md bg-canvas-soft">
      <svg
        width="120"
        height="96"
        viewBox="0 0 150 120"
        fill="none"
        aria-hidden="true"
      >
        {/* Established branches */}
        {LINES.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#07211c"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}

        {/* New branch being drawn, joining a member to the tree */}
        <line
          x1="105"
          y1="58"
          x2={NEW_NODE.cx}
          y2={NEW_NODE.cy - 6}
          stroke="#00a19a"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="46"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="46;0;0;46"
            keyTimes="0;0.4;0.85;1"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </line>

        {/* Established member nodes */}
        {NODES.map((n, i) => (
          <circle
            key={i}
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill={n.fill}
            stroke="#00a19a"
            strokeWidth="2"
          />
        ))}

        {/* Newly joining member, fading in with the branch */}
        <circle cx={NEW_NODE.cx} cy={NEW_NODE.cy} r={NEW_NODE.r} fill="#ffffff" stroke="#00a19a" strokeWidth="2">
          <animate
            attributeName="opacity"
            values="0;0;1;1;0"
            keyTimes="0;0.35;0.5;0.85;1"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Focus ring pulsing around the newly joining member */}
        <circle cx={NEW_NODE.cx} cy={NEW_NODE.cy} r={NEW_NODE.r} fill="none" stroke="#00594c" strokeWidth="1.5">
          <animate
            attributeName="r"
            values={`${NEW_NODE.r};${NEW_NODE.r + 6};${NEW_NODE.r + 6}`}
            keyTimes="0;0.5;1"
            dur="3.2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.6;0"
            keyTimes="0;0.5;1"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Sparkle accents */}
        {SPARKLES.map((s, i) => (
          <path key={i} d={sparklePath(s.cx, s.cy, s.r)} fill="#e8a33d">
            <animate
              attributeName="opacity"
              values={`${s.opacity};${s.opacity * 0.15};${s.opacity}`}
              dur={`${s.dur}s`}
              begin={`${s.delay}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}
      </svg>
    </div>
  );
}
