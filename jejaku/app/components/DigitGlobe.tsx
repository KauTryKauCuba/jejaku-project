"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { geoDistance, geoOrthographic } from "d3-geo";

// Same technique and footprint as LocationHistoryCard's receipt globe (d3-geo
// orthographic projection, draggable, ~264x211) — purely decorative here
// though, so points are scattered digits rather than country geometry, and
// it drifts on its own instead of needing a reason to touch it.
const GLOBE_WIDTH = 264;
const GLOBE_HEIGHT = Math.round(GLOBE_WIDTH * 0.8);
const DRAG_SENSITIVITY = 0.35;
const AUTO_ROTATE_DEG_PER_SEC = 6;
// How long a pick() call pauses the auto-rotation for — re-armed on every
// call, so it stays still while the user is actively typing a code and only
// starts drifting again a beat after they stop.
const PICK_PAUSE_MS = 900;
const POINT_COUNT = 640;
const SEED = 42;
// Size/opacity aren't fixed per point — they're recomputed every render from
// how close a point currently sits to dead-center of the visible hemisphere
// (see visiblePoints below), so as the sphere rotates the "large and bright"
// zone sweeps across whichever digits are passing through it, the same way
// the reference animation reads as a moving highlight band rather than a
// static scatter.
const MIN_FONT = 5;
const MAX_FONT = 15;
const MIN_OPACITY = 0.12;
const MAX_OPACITY = 1;

// Deterministic PRNG (mulberry32) — Math.random() would render a different
// digit-per-point assignment on the server vs. the client and break
// hydration; a fixed seed keeps this stable and reproducible instead.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type DigitPoint = { id: number; lng: number; lat: number; digit: number };

// A Fibonacci sphere — evenly-spaced points, not independently-random
// lat/lng — is what makes the reference's animation read as coherent rings
// sweeping past the silhouette edge together, rather than digits blinking
// in and out individually.
function generatePoints(count: number): DigitPoint[] {
  const rand = mulberry32(SEED);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    return {
      id: i,
      lat: (Math.asin(y) * 180) / Math.PI,
      lng: (Math.atan2(z, x) * 180) / Math.PI,
      digit: Math.floor(rand() * 10),
    };
  });
}

export type DigitGlobeHandle = {
  /**
   * Finds a currently-visible point showing `digit`, marks it consumed (it
   * won't be picked or rendered again), pauses auto-rotation for a beat, and
   * returns its live screen coordinates — or null if that digit isn't
   * currently facing the viewer, in which case the caller just skips the
   * fly-out animation.
   */
  pickDigit(digit: number): { x: number; y: number } | null;
};

const DigitGlobe = forwardRef<DigitGlobeHandle>(function DigitGlobe(_props, ref) {
  const points = useMemo(() => generatePoints(POINT_COUNT), []);
  const [rotation, setRotation] = useState<[number, number]>([20, -12]);
  const dragState = useRef<{ startX: number; startY: number; startRotation: [number, number] } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pickedIds, setPickedIds] = useState<Set<number>>(new Set());
  const rafRef = useRef<number | undefined>(undefined);
  const lastTsRef = useRef<number | undefined>(undefined);
  const pausedUntilRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);
  // Always-current mirrors of state the imperative pickDigit() needs to read
  // without becoming a dependency that would tear down/rebuild the rAF loop.
  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;
  const pickedIdsRef = useRef(pickedIds);
  pickedIdsRef.current = pickedIds;

  useEffect(() => {
    if (dragging) return;
    const tick = (ts: number) => {
      if (lastTsRef.current === undefined) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      if (ts >= pausedUntilRef.current) {
        setRotation(([lng, lat]) => [lng + AUTO_ROTATE_DEG_PER_SEC * dt, lat]);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = undefined;
    };
  }, [dragging]);

  const projection = useMemo(
    () =>
      geoOrthographic()
        .rotate(rotation)
        .translate([GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2])
        .scale(GLOBE_HEIGHT / 2 - 3)
        .clipAngle(90),
    [rotation]
  );

  const visiblePoints = useMemo(() => {
    const center: [number, number] = [-rotation[0], -rotation[1]];
    return points
      .filter((p) => !pickedIds.has(p.id))
      .map((p) => ({ ...p, dist: geoDistance([p.lng, p.lat], center) }))
      .filter((p) => p.dist < Math.PI / 2)
      .map((p) => {
        const [x, y] = projection([p.lng, p.lat]) ?? [0, 0];
        // 1 at dead-center of the visible hemisphere, 0 at the silhouette
        // edge — squared so the "large and bright" zone stays a tight,
        // punchy core rather than a gradual fade across the whole face.
        const t = 1 - p.dist / (Math.PI / 2);
        const eased = t * t;
        return {
          ...p,
          x,
          y,
          size: MIN_FONT + eased * (MAX_FONT - MIN_FONT),
          opacity: MIN_OPACITY + eased * (MAX_OPACITY - MIN_OPACITY),
        };
      });
  }, [points, rotation, pickedIds, projection]);

  useImperativeHandle(
    ref,
    () => ({
      pickDigit(digit: number) {
        const svg = svgRef.current;
        if (!svg) return null;

        const rot = rotationRef.current;
        const center: [number, number] = [-rot[0], -rot[1]];
        const proj = geoOrthographic()
          .rotate(rot)
          .translate([GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2])
          .scale(GLOBE_HEIGHT / 2 - 3)
          .clipAngle(90);

        // Among visible, unpicked, matching points, prefer the one closest
        // to center — the same "most prominent" point the eye is already
        // drawn to, so the pick feels intentional rather than arbitrary.
        let best: { point: DigitPoint; dist: number; x: number; y: number } | null = null;
        for (const p of points) {
          if (p.digit !== digit || pickedIdsRef.current.has(p.id)) continue;
          const dist = geoDistance([p.lng, p.lat], center);
          if (dist >= Math.PI / 2) continue;
          if (!best || dist < best.dist) {
            const [x, y] = proj([p.lng, p.lat]) ?? [0, 0];
            best = { point: p, dist, x, y };
          }
        }
        if (!best) return null;

        setPickedIds((prev) => {
          const next = new Set(prev);
          next.add(best!.point.id);
          return next;
        });
        pausedUntilRef.current = performance.now() + PICK_PAUSE_MS;

        const rect = svg.getBoundingClientRect();
        const scaleX = rect.width / GLOBE_WIDTH;
        const scaleY = rect.height / GLOBE_HEIGHT;
        return { x: rect.left + best.x * scaleX, y: rect.top + best.y * scaleY };
      },
    }),
    [points]
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      dragState.current = { startX: e.clientX, startY: e.clientY, startRotation: rotation };
    },
    [rotation]
  );

  const handlePointerMove = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const [startLng, startLat] = dragState.current.startRotation;
    const nextLat = Math.max(-90, Math.min(90, startLat - dy * DRAG_SENSITIVITY));
    setRotation([startLng + dx * DRAG_SENSITIVITY, nextLat]);
  }, []);

  const handlePointerUp = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    dragState.current = null;
    setDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${GLOBE_WIDTH} ${GLOBE_HEIGHT}`}
      className="mx-auto block w-full max-w-[220px] cursor-grab touch-none active:cursor-grabbing"
      role="img"
      aria-label="Decorative rotating sphere of scattered digits"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Same fill as the card it sits on ({colors.canvas}) so the sphere
          reads only through the scattered digits, not a colored blob —
          no border, the circular edge is left to read from the digit
          density falling away near the silhouette instead. */}
      <circle
        cx={GLOBE_WIDTH / 2}
        cy={GLOBE_HEIGHT / 2}
        r={GLOBE_HEIGHT / 2 - 3}
        fill="var(--color-canvas)"
      />
      {visiblePoints.map((p) => (
        <text
          key={p.id}
          x={p.x}
          y={p.y}
          fontSize={p.size}
          fill="var(--color-ink-mute)"
          opacity={p.opacity}
          textAnchor="middle"
          dominantBaseline="central"
          className="select-none tabular"
        >
          {p.digit}
        </text>
      ))}
    </svg>
  );
});

export default DigitGlobe;
