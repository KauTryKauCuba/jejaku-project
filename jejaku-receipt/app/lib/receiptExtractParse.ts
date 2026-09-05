// Parses receipt-extract's raw DeepSeek response text into scalar fields
// and a raw items array — tolerating a response cut off mid-JSON instead
// of discarding everything DeepSeek actually managed to read. A long
// receipt (many items) is exactly the case most likely to hit the
// response's max_tokens ceiling, so throwing the whole result away on a
// parse failure would make Quick Scan fail hardest on the receipts it's
// least able to afford failing on.
//
// Prompt field order matters here: receipt-extract's prompt always asks
// for `items` last, so when a response gets cut off, every scalar field
// (merchant, amount, date, ...) has normally already been written in full
// — only the tail of the items array is incomplete. That's what makes
// salvaging worthwhile rather than just guesswork.

export type ParsedReceiptResponse = {
  // Raw, unvalidated scalar fields as parsed from the response — the
  // caller applies the same typeof/format checks either way, truncated or
  // not. Null only when nothing at all survived parsing.
  fields: Record<string, unknown> | null;
  // Raw `items` entries, each expected to be a `[name, price, quantity?]`
  // tuple — not yet validated, see positionalItemsToObjects below.
  itemsRaw: unknown[];
  // True when the response was cut off before finishing — either the API
  // told us directly (finish_reason "length") or a truncated items array
  // had to be salvaged to get here at all.
  truncated: boolean;
};

export function parseReceiptResponse(text: string, finishReason: string | null | undefined): ParsedReceiptResponse {
  const finishTruncated = finishReason === "length";
  const braceIndex = text.indexOf("{");
  if (braceIndex === -1) {
    return { fields: null, itemsRaw: [], truncated: finishTruncated };
  }

  // A genuinely truncated response never has a closing brace at all — a
  // regex requiring one (the original approach here) would never even
  // reach the salvage path for exactly the responses that need it most.
  // Only attempt the well-formed fast path when a `}` actually exists
  // after the opening one; otherwise go straight to salvaging whatever
  // text survived from the first `{` to the literal end of the response.
  const lastBraceIndex = text.lastIndexOf("}");
  if (lastBraceIndex > braceIndex) {
    // Trims any trailing chatter the model added after the JSON object —
    // `JSON.parse` rejects trailing content, even harmless whitespace-
    // adjacent text.
    const candidate = text.slice(braceIndex, lastBraceIndex + 1);
    try {
      const parsed = JSON.parse(candidate);
      const itemsRaw = Array.isArray(parsed?.items) ? parsed.items : [];
      return { fields: parsed, itemsRaw, truncated: finishTruncated };
    } catch {
      // Falls through to salvage — either genuinely malformed, or that
      // last `}` doesn't actually belong to the outer object.
    }
  }

  return salvageTruncatedResponse(text.slice(braceIndex));
}

function salvageTruncatedResponse(blob: string): ParsedReceiptResponse {
  const itemsKeyIndex = blob.indexOf('"items"');
  if (itemsKeyIndex === -1) {
    // The cut happened before `items` even started — try to recover
    // whatever scalar fields did make it in; if that also fails, there's
    // genuinely nothing usable in this response.
    return { fields: salvageScalarPrefix(blob), itemsRaw: [], truncated: true };
  }

  // Everything before "items" should be complete JSON (see the file-level
  // comment on prompt field order) — close it off and parse just that
  // slice, excluding the truncated tail entirely.
  const fields = salvageScalarPrefix(blob.slice(0, itemsKeyIndex));

  const afterItemsKey = blob.slice(itemsKeyIndex);
  const arrayStart = afterItemsKey.indexOf("[");
  const itemsRaw: unknown[] = [];
  if (arrayStart !== -1) {
    const itemsBlob = afterItemsKey.slice(arrayStart);
    // Item entries are flat arrays (no nesting), so a simple no-nested-
    // bracket match reliably captures every *complete* entry and simply
    // fails to match a trailing, cut-off one — exactly the split we want.
    const entryMatches = itemsBlob.match(/\[[^[\]]*\]/g) ?? [];
    for (const entry of entryMatches) {
      try {
        itemsRaw.push(JSON.parse(entry));
      } catch {
        // A bracket-shaped match that still isn't valid JSON (e.g. a
        // stray `]` inside a quoted item name) — drop that one entry
        // rather than losing the whole salvage over it.
      }
    }
  }

  return { fields, itemsRaw, truncated: true };
}

// Closes a truncated object prefix into valid JSON by trimming a trailing
// incomplete token/dangling comma and appending the closing brace.
function salvageScalarPrefix(prefix: string): Record<string, unknown> | null {
  const trimmed = prefix.replace(/,\s*$/, "");
  const candidate = trimmed.endsWith("}") ? trimmed : `${trimmed}}`;
  try {
    const parsed = JSON.parse(candidate);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Converts raw `[name, price, quantity?]` tuples (the compact shape the
// prompt now asks for — see the prompt text in receipt-extract's route)
// into the plain objects normalizeItems (lib/expenses.ts) already knows
// how to validate, backfill an id onto, and turn into real ExpenseItems.
// Same tolerance normalizeItems itself has: an unusable entry is dropped,
// not treated as a reason to fail the whole list.
export function positionalItemsToObjects(itemsRaw: unknown[]): { name: string; price: number; quantity?: number }[] {
  const result: { name: string; price: number; quantity?: number }[] = [];
  for (const entry of itemsRaw) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const [name, price, quantity] = entry;
    if (typeof name !== "string" || typeof price !== "number" || !Number.isFinite(price)) continue;
    // Quantity 1 is the implicit default everywhere downstream (lineTotal,
    // display, etc. already treat `quantity ?? 1` as equivalent) — leaving
    // it off here for that common case is what the compact array format
    // is actually for; keeping it whenever it's genuinely meaningful.
    const hasRealQuantity = typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0 && quantity !== 1;
    result.push(hasRealQuantity ? { name, price, quantity } : { name, price });
  }
  return result;
}
