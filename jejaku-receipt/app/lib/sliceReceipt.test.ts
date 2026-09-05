import { describe, expect, it } from "vitest";
import { computeTileBounds } from "./sliceReceipt";

describe("computeTileBounds", () => {
  it("returns a single full-height tile when not flagged as long, regardless of aspect ratio", () => {
    expect(computeTileBounds(1000, 1500, false)).toEqual([{ top: 0, height: 1500 }]);
    expect(computeTileBounds(300, 6000, false)).toEqual([{ top: 0, height: 6000 }]); // extreme aspect, still untouched
  });

  it("returns a single full-height tile for degenerate (zero/negative) dimensions even when flagged", () => {
    expect(computeTileBounds(0, 1000, true)).toEqual([{ top: 0, height: 1000 }]);
    expect(computeTileBounds(1000, 0, true)).toEqual([{ top: 0, height: 0 }]);
    expect(computeTileBounds(-5, 1000, true)).toEqual([{ top: 0, height: 1000 }]);
  });

  it("never slices into fewer than 3 tiles once flagged, even for a modest aspect ratio", () => {
    // aspect 2:1 -> aspectBasedCount = ceil(2/1.5) = 2, but the floor is 3
    const tiles = computeTileBounds(1000, 2000, true);
    expect(tiles.length).toBe(3);
  });

  it("scales tile count up with a more extreme aspect ratio, capped at 6", () => {
    // aspect 12:1 -> ceil(12/1.5) = 8, capped to 6
    const tiles = computeTileBounds(500, 6000, true);
    expect(tiles.length).toBe(6);
  });

  it("covers the full image height with no gap between tiles", () => {
    const tiles = computeTileBounds(1000, 4500, true);
    expect(tiles[0].top).toBe(0);
    const last = tiles[tiles.length - 1];
    expect(last.top + last.height).toBe(4500);
  });

  it("gives consecutive tiles a small overlap (each tile's bottom edge extends past the next tile's start)", () => {
    const tiles = computeTileBounds(1000, 4500, true);
    for (let i = 0; i < tiles.length - 1; i++) {
      const thisBottom = tiles[i].top + tiles[i].height;
      const nextTop = tiles[i + 1].top;
      expect(thisBottom).toBeGreaterThan(nextTop); // overlap, not a gap or exact touch
    }
  });

  it("produces every tile with positive height", () => {
    const tiles = computeTileBounds(800, 5000, true);
    for (const tile of tiles) {
      expect(tile.height).toBeGreaterThan(0);
    }
  });

  it("is deterministic for the same input", () => {
    expect(computeTileBounds(1000, 4500, true)).toEqual(computeTileBounds(1000, 4500, true));
  });
});
