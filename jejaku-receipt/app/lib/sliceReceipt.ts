// Splits a captured receipt image into vertical tiles for extraction —
// only when the user has explicitly flagged the receipt as long (the
// "Long receipt" toggle in CameraCapture). The captured frame's own
// aspect ratio can't be trusted as an automatic trigger: it reflects the
// phone's fixed camera aspect (~2:1 portrait) regardless of receipt
// length, since the frame includes whatever background surrounds the
// receipt, not just the receipt itself — a long receipt photographed by
// backing away still produces a frame shaped the same as a short one, just
// with the receipt occupying less of it. There's no reliable way to
// detect "this is a long receipt" from pixels alone without real
// document-edge detection, so the user says so instead.
//
// Splitting serves two independent purposes, not just one: it gives each
// tile its own fresh ~800x800-pixel/384-token budget on DeepSeek's side
// (recovering resolution a single long image would lose), and it keeps
// each tile's own item count low enough to avoid the consistency drift
// documented in receipt-extract's route (the model held a per-line rule
// correctly for the first ~15 lines of a 38-item receipt, then started
// getting it wrong) — both reasons point to the same fix.

const TILE_ASPECT_RATIO = 1.5;
// Once the user has flagged a receipt as long, never slice into fewer
// than this — the frame's own aspect ratio can undersell how long the
// receipt actually is (see the file comment), so this floor is what
// keeps each tile's item count comfortably under the ~15-line point where
// compliance drift was observed, even on a frame that doesn't look
// dramatically tall.
const MIN_TILES_WHEN_FLAGGED = 3;
// Ceiling for cost/latency — matches receipt-extract's own MAX_IMAGES
// server-side cap with margin.
const MAX_TILES = 6;
// How much of each tile's bottom edge repeats at the top of the next tile
// — small on purpose: just enough that a line near the seam is very
// unlikely to be split in half and dropped from both tiles, without
// creating enough duplication for the model to plausibly read the same
// line twice as two different lines.
const TILE_OVERLAP_RATIO = 0.06;

export type TileBounds = {
  /** Pixel offset from the top of the source image. */
  top: number;
  /** Pixel height of this tile, overlap included. */
  height: number;
};

// Pure math, no canvas — the part worth unit-testing precisely. Returns a
// single full-height tile whenever the receipt hasn't been flagged as
// long, regardless of aspect ratio (see the file comment on why aspect
// ratio alone is never treated as an automatic trigger).
export function computeTileBounds(width: number, height: number, flaggedAsLong: boolean): TileBounds[] {
  if (!flaggedAsLong || width <= 0 || height <= 0) {
    return [{ top: 0, height }];
  }

  const aspect = height / width;
  const aspectBasedCount = Math.ceil(aspect / TILE_ASPECT_RATIO);
  const tileCount = Math.min(MAX_TILES, Math.max(MIN_TILES_WHEN_FLAGGED, aspectBasedCount));

  const baseHeight = height / tileCount;
  const overlap = Math.round(baseHeight * TILE_OVERLAP_RATIO);

  const tiles: TileBounds[] = [];
  for (let i = 0; i < tileCount; i++) {
    const top = Math.max(0, Math.round(i * baseHeight) - (i > 0 ? overlap : 0));
    const bottom = Math.min(height, Math.round((i + 1) * baseHeight) + (i < tileCount - 1 ? overlap : 0));
    tiles.push({ top, height: bottom - top });
  }
  return tiles;
}

// Canvas-based slicing — draws each computed tile from the source canvas
// onto its own canvas and exports as JPEG. Thin on purpose: all the
// actual decision-making already happened in computeTileBounds above.
export function sliceCanvas(source: HTMLCanvasElement, flaggedAsLong: boolean, quality = 0.9): string[] {
  const bounds = computeTileBounds(source.width, source.height, flaggedAsLong);
  if (bounds.length === 1) return [source.toDataURL("image/jpeg", quality)];

  return bounds.map(({ top, height }) => {
    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = source.width;
    tileCanvas.height = height;
    const ctx = tileCanvas.getContext("2d");
    if (!ctx) return source.toDataURL("image/jpeg", quality);
    ctx.drawImage(source, 0, top, source.width, height, 0, 0, source.width, height);
    return tileCanvas.toDataURL("image/jpeg", quality);
  });
}
