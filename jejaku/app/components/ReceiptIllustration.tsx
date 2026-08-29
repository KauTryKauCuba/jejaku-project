function sparklePath(cx: number, cy: number, r: number) {
  const k = r * 0.3;
  return `M${cx} ${cy - r}L${cx + k} ${cy - k}L${cx + r} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + r}L${cx - k} ${cy + k}L${cx - r} ${cy}L${cx - k} ${cy - k}Z`;
}

const SPARKLES = [
  { cx: 54, cy: 15, r: 3, opacity: 0.7, dur: 2.4, delay: 0.2 },
  { cx: 116, cy: 23, r: 3.5, opacity: 0.85, dur: 2.8, delay: 0.9 },
  { cx: 16, cy: 103, r: 4, opacity: 0.6, dur: 2.2, delay: 0.5 },
  { cx: 112, cy: 107, r: 3, opacity: 0.75, dur: 3, delay: 1.3 },
  { cx: 134, cy: 85, r: 4.5, opacity: 0.9, dur: 2.6, delay: 0.1 },
];

export default function ReceiptIllustration() {
  return (
    <div className="flex h-[140px] w-full items-center justify-center overflow-hidden rounded-md bg-canvas-soft">
      <svg
        width="120"
        height="96"
        viewBox="0 0 150 120"
        fill="none"
        aria-hidden="true"
      >
        {/* Receipt strip */}
        <path
          d="M40 19h50a4 4 0 0 1 4 4v78l-7-5-7 5-7-5-7 5-7-5-7 5-7-5-7 5V23a4 4 0 0 1 4-4Z"
          fill="#ffffff"
          stroke="#dce9e5"
          strokeWidth="1.5"
        />
        {/* Text lines */}
        <line x1="48" y1="33" x2="86" y2="33" stroke="#5c766e" strokeWidth="2" strokeLinecap="round" />
        <line x1="48" y1="41" x2="76" y2="41" stroke="#5c766e" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="48" y1="53" x2="80" y2="53" stroke="#5c766e" strokeWidth="2" strokeLinecap="round" />
        <line x1="48" y1="61" x2="66" y2="61" stroke="#5c766e" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="48" y1="73" x2="84" y2="73" stroke="#00594c" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="48" y1="81" x2="70" y2="81" stroke="#5c766e" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

        {/* Scan beam sweeping across the receipt */}
        <rect x="40" y="17" width="54" height="2.5" rx="1.25" fill="#00a19a" opacity="0.35">
          <animate
            attributeName="y"
            values="15;103;15"
            dur="3.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
          />
        </rect>

        {/* Corner brackets, camera capture frame around the receipt */}
        <path d="M26 25v-12a4 4 0 0 1 4-4h12" stroke="#07211c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M108 25v-12a4 4 0 0 0-4-4h-12" stroke="#07211c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M26 95v12a4 4 0 0 0 4 4h12" stroke="#07211c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M108 95v12a4 4 0 0 1-4 4h-12" stroke="#07211c" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Sparkle accent */}
        <path d="M120 62l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8Z" fill="#e8a33d">
          <animate
            attributeName="opacity"
            values="1;0.15;1"
            dur="2.4s"
            begin="0s"
            repeatCount="indefinite"
          />
        </path>

        {/* Extra sparkle accents scattered around the frame, each blinking on its own beat */}
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
