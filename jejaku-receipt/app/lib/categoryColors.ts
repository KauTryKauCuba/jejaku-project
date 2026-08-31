import { EXPENSE_CATEGORIES } from "./expenses";

// The dataviz-validated 8-slot categorical palette (see the dataviz skill's
// references/palette.md) — this fixed order clears the CVD/contrast gates
// for adjacent bars/stacks, unlike a hash-derived color which can (and did)
// collide between categories that happen to hash to the same slot.
const CATEGORY_PALETTE = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

// Built-in categories get a fixed, deterministic slot (no two ever collide).
// A user's custom category — open-ended text outside that set — falls back
// to a hash into the same palette; a rare collision there is an acceptable
// tradeoff for not having to gray out categories people create themselves.
export function colorForCategory(category: string) {
  const builtinIndex = (EXPENSE_CATEGORIES as readonly string[]).indexOf(category);
  if (builtinIndex !== -1) {
    return CATEGORY_PALETTE[builtinIndex % CATEGORY_PALETTE.length];
  }
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) | 0;
  }
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
}
