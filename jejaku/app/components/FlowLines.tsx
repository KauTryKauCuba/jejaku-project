"use client";

import { useEffect, useState } from "react";

type FlowPath = {
  d: string;
  w: number;
  dur: number;
  delay: number;
  opacity: number;
};

const FLOW_DURATION = 12.8;

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function buildPaths(): FlowPath[] {
  const rand = seededRandom(42);
  const paths: FlowPath[] = [];
  const count = 5;

  for (let i = 0; i < count; i++) {
    const startX = -200 + rand() * 700;
    const endX = 1100 + rand() * 700;
    const startY = 40 + rand() * 820;
    const endY = 40 + rand() * 820;
    const bow = 80 + rand() * 380;
    const bowDir = rand() > 0.5 ? 1 : -1;
    const span = endX - startX;

    const c1x = startX + span * (0.2 + rand() * 0.15);
    const c1y = startY + bow * bowDir * (0.3 + rand() * 0.4);
    const c2x = startX + span * (0.45 + rand() * 0.15);
    const c2y = startY + (endY - startY) * 0.5 + bow * bowDir;
    const c3x = startX + span * (0.75 + rand() * 0.15);
    const c3y = endY - bow * bowDir * (0.2 + rand() * 0.3);
    const midX = startX + span * (0.55 + rand() * 0.1);
    const midY = startY + (endY - startY) * (0.6 + rand() * 0.15);

    const d = `M ${startX.toFixed(0)} ${startY.toFixed(0)} C ${c1x.toFixed(
      0,
    )} ${c1y.toFixed(0)}, ${c2x.toFixed(0)} ${c2y.toFixed(0)}, ${midX.toFixed(
      0,
    )} ${midY.toFixed(0)} S ${c3x.toFixed(0)} ${c3y.toFixed(
      0,
    )}, ${endX.toFixed(0)} ${endY.toFixed(0)}`;

    paths.push({
      d,
      w: 0.5 + rand() * 1.3,
      dur: FLOW_DURATION,
      delay: (i / count) * FLOW_DURATION,
      opacity: 0.3 + rand() * 0.5,
    });
  }

  return paths;
}

const PATHS = buildPaths();
const DASH_PERIOD = 880;

export default function FlowLines() {
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id="flow-mask-gradient"
          cx="50%"
          cy="38%"
          r="65%"
          gradientTransform="translate(0.5 0.38) scale(1 0.68) translate(-0.5 -0.38)"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <mask id="flow-edge-mask">
          <rect x="0" y="0" width="1600" height="900" fill="url(#flow-mask-gradient)" />
        </mask>
        {PATHS.map((p, i) => (
          <linearGradient
            key={i}
            id={`flow-dash-gradient-${i}`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={DASH_PERIOD}
            y2="0"
            spreadMethod="repeat"
          >
            {!reducedMotion && (
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values={`0 0; ${DASH_PERIOD} 0`}
                keyTimes="0; 1"
                calcMode="linear"
                dur={`${p.dur}s`}
                begin={`${p.delay}s`}
                repeatCount="indefinite"
              />
            )}
            <stop offset="0%" stopColor="#00594c" stopOpacity="0" />
            <stop offset="12%" stopColor="#00a19a" stopOpacity="0.65" />
            <stop offset="24%" stopColor="#7fe0c4" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#00a19a" stopOpacity="0.65" />
            <stop offset="48%" stopColor="#00594c" stopOpacity="0" />
            <stop offset="100%" stopColor="#00594c" stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      <g mask="url(#flow-edge-mask)">
        {PATHS.map((p, i) => (
          <g
            key={i}
            className="flow-line-enter"
            style={
              {
                "--flow-target-opacity": p.opacity,
                animationDelay: `${i * 0.35}s`,
              } as React.CSSProperties
            }
          >
            <path
              d={p.d}
              fill="none"
              stroke={`url(#flow-dash-gradient-${i})`}
              strokeWidth={p.w}
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
