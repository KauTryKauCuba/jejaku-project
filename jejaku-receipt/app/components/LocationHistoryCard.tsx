"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { MagnifyingGlassMinus, MagnifyingGlassPlus, MapPin } from "@phosphor-icons/react";
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { useExpenses } from "./ExpensesProvider";
import IconFlowBadge from "./IconFlowBadge";
import worldCountries from "../lib/worldCountries.json";

type CountryFeature = { type: "Feature"; properties: { name: string }; geometry: unknown };
const COUNTRIES = (worldCountries as { features: CountryFeature[] }).features;

// The receipt's `country` text doesn't always match this dataset's country
// name (Natural Earth, via world-atlas) exactly — only alias the ones that
// actually diverge for names in cityCoordinates.ts's country list. A
// country with no match (e.g. Singapore/Hong Kong, too small for this
// simplified 110m dataset) just doesn't get highlighted; its pin still
// shows.
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "united states": "united states of america",
};

function matchCountryName(userCountry: string) {
  const normalized = userCountry.trim().toLowerCase();
  return COUNTRY_NAME_ALIASES[normalized] ?? normalized;
}

// A draggable orthographic (spinning-globe) projection, not a map library —
// nothing else in this app pulls in charting/map dependencies either (see
// MonthlyTrendTile's hand-rolled bars), so this stays a small addition
// (d3-geo only, ~35KB) rather than a full 3D/WebGL globe. The land outline
// is a pre-simplified per-country GeoJSON asset (Natural Earth 110m via
// world-atlas, see lib/worldCountries.json) recomputed into screen
// coordinates on every rotation, since — unlike a flat map — a globe's
// projection can't be pre-rendered to one static path. Per-country (not
// one merged landmass) so a country with a receipt can be filled in a
// different color than the rest.

// Canvas spans the card's full width, but the sphere's diameter is tied to
// GLOBE_HEIGHT (80% of that), so it stays the same size as before — just
// centered in a wider box instead of the box itself shrinking.
const GLOBE_WIDTH = 264;
const GLOBE_HEIGHT = Math.round(GLOBE_WIDTH * 0.8);
const INITIAL_ROTATION: [number, number] = [-100, -10];
const DRAG_SENSITIVITY = 0.35; // degrees rotated per pixel dragged
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 3;
const ZOOM_STEP = 1.25;

// The point facing the viewer is the antipode of the current rotation —
// standard d3-geo orthographic convention. A point more than 90° from it
// is around the back of the globe and shouldn't be drawn as a marker.
function isFacingViewer(rotation: [number, number], point: [number, number]) {
  const center: [number, number] = [-rotation[0], -rotation[1]];
  return geoDistance(point, center) < Math.PI / 2;
}

const CLUSTER_THRESHOLD = 6; // px — points closer than this look like one dot
const JITTER_RADIUS = 6;

function layoutPoints(points: { key: string; x: number; y: number }[]) {
  const positions = new Map<string, { x: number; y: number }>();
  const placed = new Set<string>();

  for (const p of points) {
    if (placed.has(p.key)) continue;
    const cluster = points.filter(
      (o) => !placed.has(o.key) && Math.hypot(o.x - p.x, o.y - p.y) < CLUSTER_THRESHOLD
    );
    cluster.forEach((c) => placed.add(c.key));

    if (cluster.length === 1) {
      positions.set(cluster[0].key, { x: cluster[0].x, y: cluster[0].y });
      continue;
    }

    const cx = cluster.reduce((sum, c) => sum + c.x, 0) / cluster.length;
    const cy = cluster.reduce((sum, c) => sum + c.y, 0) / cluster.length;
    cluster.forEach((c, i) => {
      const angle = (i / cluster.length) * Math.PI * 2;
      positions.set(c.key, { x: cx + Math.cos(angle) * JITTER_RADIUS, y: cy + Math.sin(angle) * JITTER_RADIUS });
    });
  }

  return positions;
}

type LocationGroup = {
  key: string;
  city?: string;
  state?: string;
  country?: string;
  lat: number;
  lng: number;
  count: number;
  lastDate: string;
};

export default function LocationHistoryCard() {
  const expenses = useExpenses();
  const [hovered, setHovered] = useState<string | null>(null);
  const [rotation, setRotation] = useState<[number, number]>(INITIAL_ROTATION);
  const [zoom, setZoom] = useState(1);
  const dragState = useRef<{ startX: number; startY: number; startRotation: [number, number] } | null>(null);

  const groups = useMemo(() => {
    const byKey = new Map<string, LocationGroup>();
    for (const e of expenses) {
      if (e.lat === undefined || e.lng === undefined) continue;
      const key = [e.city, e.state, e.country].filter(Boolean).join(", ") || `${e.lat},${e.lng}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.count += 1;
        if (e.date > existing.lastDate) existing.lastDate = e.date;
      } else {
        byKey.set(key, {
          key,
          city: e.city,
          state: e.state,
          country: e.country,
          lat: e.lat,
          lng: e.lng,
          count: 1,
          lastDate: e.date,
        });
      }
    }
    return [...byKey.values()].sort((a, b) => (a.lastDate < b.lastDate ? 1 : -1));
  }, [expenses]);

  const projection = useMemo(
    () =>
      geoOrthographic()
        .rotate(rotation)
        .translate([GLOBE_WIDTH / 2, GLOBE_HEIGHT / 2])
        .scale((GLOBE_HEIGHT / 2 - 4) * zoom)
        .clipAngle(90),
    [rotation, zoom]
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const matchedCountries = useMemo(
    () => new Set(groups.map((g) => g.country).filter((c): c is string => !!c).map(matchCountryName)),
    [groups]
  );
  const countryPaths = useMemo(
    () =>
      COUNTRIES.map((f) => ({
        name: f.properties.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d: pathGen(f as any) ?? "",
        hasValue: matchedCountries.has(f.properties.name.toLowerCase()),
      })),
    [pathGen, matchedCountries]
  );
  const graticulePath = useMemo(() => pathGen(geoGraticule10()) ?? "", [pathGen]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outlinePath = useMemo(() => pathGen({ type: "Sphere" } as any) ?? "", [pathGen]);

  const visibleGroups = useMemo(
    () => groups.filter((g) => isFacingViewer(rotation, [g.lng, g.lat])),
    [groups, rotation]
  );
  const positions = useMemo(
    () =>
      layoutPoints(
        visibleGroups.map((g) => {
          const [x, y] = projection([g.lng, g.lat]) ?? [0, 0];
          return { key: g.key, x, y };
        })
      ),
    [visibleGroups, projection]
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { startX: e.clientX, startY: e.clientY, startRotation: rotation };
    },
    [rotation]
  );

  const handlePointerMove = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const [startLambda, startPhi] = dragState.current.startRotation;
    const nextPhi = Math.max(-90, Math.min(90, startPhi - dy * DRAG_SENSITIVITY));
    setRotation([startLambda + dx * DRAG_SENSITIVITY, nextPhi]);
  }, []);

  const handlePointerUp = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, z * ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, z / ZOOM_STEP)), []);

  const handleWheel = useCallback((e: ReactWheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setZoom((z) => {
      const next = e.deltaY < 0 ? z * ZOOM_STEP : z / ZOOM_STEP;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    });
  }, []);

  return (
    <div className="min-w-0 rounded-lg border border-hairline bg-canvas p-[20px]">
      <IconFlowBadge size={40} seed={8}>
        <MapPin size={16} weight="light" />
      </IconFlowBadge>

      <h3 className="mt-[15px] text-[15px] font-light tracking-[-0.19px] text-ink">
        Receipt Locations
      </h3>
      <p className="mt-[4px] text-[12px] leading-relaxed text-ink-mute">
        Drag the globe to look around.
      </p>

      {groups.length === 0 ? (
        <p className="mt-[19px] text-[12px] text-ink-mute">
          No locations yet — add a city on a receipt to see it here.
        </p>
      ) : (
        <>
          <div className="relative mt-[15px] w-full">
            <svg
              viewBox={`0 0 ${GLOBE_WIDTH} ${GLOBE_HEIGHT}`}
              className="block w-full cursor-grab touch-none active:cursor-grabbing"
              role="img"
              aria-label="Draggable globe of receipt locations"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
            >
              <path d={outlinePath} className="fill-canvas-soft stroke-hairline" strokeWidth={0.75} />
              <path d={graticulePath} className="fill-none stroke-hairline" strokeWidth={0.3} />
              {countryPaths.map((c) => (
                <path
                  key={c.name}
                  d={c.d}
                  className={
                    c.hasValue
                      ? "fill-primary/60 stroke-primary"
                      : "fill-primary-subdued/70 stroke-primary-soft/50"
                  }
                  strokeWidth={0.35}
                  strokeLinejoin="round"
                />
              ))}
              {visibleGroups.map((g) => {
                const { x, y } = positions.get(g.key) ?? { x: 0, y: 0 };
                const isHovered = hovered === g.key;
                return (
                  <g
                    key={g.key}
                    className="cursor-pointer"
                    onPointerEnter={() => setHovered(g.key)}
                    onPointerLeave={() => setHovered((h) => (h === g.key ? null : h))}
                  >
                    <circle cx={x} cy={y} r={isHovered ? 9 : 6.5} className="fill-primary/15 transition-[r]" />
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 4.5 : 3.5}
                      className="fill-primary stroke-canvas transition-[r]"
                      strokeWidth={1.3}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-[8px] right-[8px] flex flex-col overflow-hidden rounded-md border border-hairline bg-canvas shadow-sm">
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
                className="flex h-[26px] w-[26px] items-center justify-center text-ink-mute transition-colors hover:bg-canvas-soft disabled:opacity-30"
              >
                <MagnifyingGlassPlus size={13} weight="light" />
              </button>
              <div className="h-px bg-hairline" />
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
                className="flex h-[26px] w-[26px] items-center justify-center text-ink-mute transition-colors hover:bg-canvas-soft disabled:opacity-30"
              >
                <MagnifyingGlassMinus size={13} weight="light" />
              </button>
            </div>

            {hovered && (
              <div className="pointer-events-none absolute left-[8px] top-[8px] rounded-sm border border-hairline bg-canvas px-[9px] py-[6px] text-[11px] shadow-lg">
                {(() => {
                  const g = groups.find((g) => g.key === hovered);
                  if (!g) return null;
                  return (
                    <>
                      <p className="font-medium text-ink">{g.key}</p>
                      <p className="text-ink-mute">
                        {g.count} receipt{g.count === 1 ? "" : "s"}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <ul className="mt-[15px] flex flex-col divide-y divide-hairline">
            {groups.map((g) => (
              <li key={g.key} className="flex items-center justify-between gap-[11px] py-[8px] first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">{g.city || g.country || "Unknown"}</p>
                  <p className="truncate text-[11px] text-ink-mute">
                    {[g.state, g.country].filter(Boolean).join(", ") || " "}
                  </p>
                </div>
                <p className="shrink-0 text-[11px] text-ink-mute">
                  {g.count} receipt{g.count === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
