"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
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
// Size/opacity aren't fixed per point — they're recomputed every frame from
// how close a point currently sits to dead-center of the visible hemisphere
// (see draw() below), so as the sphere rotates the "large and bright" zone
// sweeps across whichever digits are passing through it, the same way the
// reference animation reads as a moving highlight band rather than a static
// scatter.
const MIN_FONT = 5;
const MAX_FONT = 15;
const MIN_OPACITY = 0.12;
const MAX_OPACITY = 1;
// Retina rendering past 2x buys no visible sharpness here (the globe tops
// out at 220px on screen) but quadruples the pixels the browser has to
// rasterize every frame — capped so high-dpr phones don't pay for it.
const MAX_DEVICE_PIXEL_RATIO = 2;

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

// Rendered on <canvas> rather than as one SVG <text> per point: rotation
// used to live in React state, so every rAF tick re-rendered ~320 visible
// digits through React's reconciler at 60fps — fine on desktop, visibly
// janky on mobile. Rotation, drag state, and picked ids now live in refs and
// the rAF loop paints directly onto the canvas, so the animation never
// touches React at all (only pickDigit's one-time mutation does, to redraw
// the frame a digit was just consumed on).
const DigitGlobe = forwardRef<DigitGlobeHandle>(function DigitGlobe(_props, ref) {
  const points = useMemo(() => generatePoints(POINT_COUNT), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef<[number, number]>([20, -12]);
  const pickedIdsRef = useRef<Set<number>>(new Set());
  const draggingRef = useRef(false);
  const dragState = useRef<{ startX: number; startY: number; startRotation: [number, number] } | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const lastTsRef = useRef<number | undefined>(undefined);
  const pausedUntilRef = useRef(0);
  const styleRef = useRef({ canvasFill: "#fff", textFill: "#888", fontFamily: "sans-serif" });

  const readStyles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const computed = getComputedStyle(canvas);
    styleRef.current = {
      canvasFill: computed.getPropertyValue("--color-canvas").trim() || "#fff",
      textFill: computed.getPropertyValue("--color-ink-mute").trim() || "#888",
      fontFamily: computed.fontFamily || "sans-serif",
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rotation = rotationRef.current;
    const projection = geoOrthographic()
      .rotate(rotation)
      .translate([GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2])
      .scale(GLOBE_HEIGHT / 2 - 3)
      .clipAngle(90);
    const center: [number, number] = [-rotation[0], -rotation[1]];
    const { canvasFill, textFill, fontFamily } = styleRef.current;

    ctx.clearRect(0, 0, GLOBE_WIDTH, GLOBE_HEIGHT);
    ctx.fillStyle = canvasFill;
    ctx.beginPath();
    ctx.arc(GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2, GLOBE_HEIGHT / 2 - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textFill;

    const pickedIds = pickedIdsRef.current;
    for (const p of points) {
      if (pickedIds.has(p.id)) continue;
      const dist = geoDistance([p.lng, p.lat], center);
      if (dist >= Math.PI / 2) continue;
      const projected = projection([p.lng, p.lat]);
      if (!projected) continue;
      // 1 at dead-center of the visible hemisphere, 0 at the silhouette
      // edge — squared so the "large and bright" zone stays a tight, punchy
      // core rather than a gradual fade across the whole face.
      const t = 1 - dist / (Math.PI / 2);
      const eased = t * t;
      const size = MIN_FONT + eased * (MAX_FONT - MIN_FONT);
      const opacity = MIN_OPACITY + eased * (MAX_OPACITY - MIN_OPACITY);
      ctx.globalAlpha = opacity;
      ctx.font = `${size}px ${fontFamily}`;
      ctx.fillText(String(p.digit), projected[0], projected[1]);
    }
    ctx.globalAlpha = 1;
  }, [points]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    // Logical drawing space stays GLOBE_WIDTH x GLOBE_HEIGHT regardless of
    // the canvas's actual displayed size or device pixel ratio — the same
    // role the SVG's viewBox used to play.
    ctx?.setTransform(
      (rect.width / GLOBE_WIDTH) * dpr,
      0,
      0,
      (rect.height / GLOBE_HEIGHT) * dpr,
      0,
      0
    );
    readStyles();
  }, [readStyles]);

  useEffect(() => {
    resizeCanvas();
    draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      resizeCanvas();
      draw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [resizeCanvas, draw]);

  useEffect(() => {
    const tick = (ts: number) => {
      if (lastTsRef.current === undefined) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      if (!draggingRef.current && ts >= pausedUntilRef.current) {
        const [lng, lat] = rotationRef.current;
        rotationRef.current = [lng + AUTO_ROTATE_DEG_PER_SEC * dt, lat];
      }
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = undefined;
    };
  }, [draw]);

  useImperativeHandle(
    ref,
    () => ({
      pickDigit(digit: number) {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rotation = rotationRef.current;
        const center: [number, number] = [-rotation[0], -rotation[1]];
        const proj = geoOrthographic()
          .rotate(rotation)
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
            const projected = proj([p.lng, p.lat]) ?? [0, 0];
            best = { point: p, dist, x: projected[0], y: projected[1] };
          }
        }
        if (!best) return null;

        pickedIdsRef.current = new Set(pickedIdsRef.current).add(best.point.id);
        pausedUntilRef.current = performance.now() + PICK_PAUSE_MS;
        draw();

        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / GLOBE_WIDTH;
        const scaleY = rect.height / GLOBE_HEIGHT;
        return { x: rect.left + best.x * scaleX, y: rect.top + best.y * scaleY };
      },
    }),
    [points, draw]
  );

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    dragState.current = { startX: e.clientX, startY: e.clientY, startRotation: rotationRef.current };
  }, []);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const [startLng, startLat] = dragState.current.startRotation;
    const nextLat = Math.max(-90, Math.min(90, startLat - dy * DRAG_SENSITIVITY));
    rotationRef.current = [startLng + dx * DRAG_SENSITIVITY, nextLat];
  }, []);

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    dragState.current = null;
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Decorative rotating sphere of scattered digits"
      className="mx-auto block w-full max-w-[220px] cursor-grab touch-none active:cursor-grabbing"
      style={{ aspectRatio: `${GLOBE_WIDTH} / ${GLOBE_HEIGHT}` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
});

export default DigitGlobe;
