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
  // Raw `items` entries — each expected to be a `{name, quantity, numbers}`
  // object (see itemEntriesToObjects below for exactly what shape is
  // expected and why), not yet validated as such.
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
    // +1 to start scanning at the array's *contents*, not the opening
    // bracket itself — otherwise that bracket gets counted as depth and
    // every real entry inside would be read one level too deep.
    const itemsBlob = afterItemsKey.slice(arrayStart + 1);
    for (const entry of extractCompleteJsonEntries(itemsBlob)) {
      try {
        itemsRaw.push(JSON.parse(entry));
      } catch {
        // A bracket-balanced chunk that still isn't valid JSON (e.g. a
        // trailing comma, or a stray bracket inside a quoted item name)
        // — drop that one entry rather than losing the whole salvage.
      }
    }
  }

  return { fields, itemsRaw, truncated: true };
}

// Scans a sequence of top-level JSON entries (objects or arrays) that may
// themselves be nested — an item entry now carries its own `numbers`
// array (see itemEntriesToObjects), so entries are no longer flat and a
// simple "no nested brackets" regex isn't enough. Tracks bracket depth and
// quoted-string state (so a brace/bracket character inside a quoted item
// name doesn't get miscounted) and yields only entries that fully closed
// before the text ran out — a trailing entry cut off mid-way is silently
// omitted, not yielded partially, which is exactly the split truncation
// salvage needs.
function extractCompleteJsonEntries(text: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{" || ch === "[") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }
    if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        entries.push(text.slice(start, i + 1));
        start = -1;
      } else if (depth < 0) {
        // The array's own closing bracket, or something similarly
        // unbalanced — stop rather than let depth go permanently negative.
        return entries;
      }
    }
  }
  return entries;
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

export type ResolvedItem = {
  name: string;
  price: number;
  quantity?: number;
  // True when this line's own printed numbers didn't reconcile with each
  // other — see resolveLinePrice below. A per-line signal, sharper than
  // the whole-receipt computeItemsMismatch check in receiptSanity.ts:
  // this flags exactly which item looked wrong, not just "something on
  // this receipt doesn't add up".
  priceUncertain: boolean;
};

// Turns quantity + the RAW numbers printed on a line into a per-unit
// price — this is deterministic app-side math, not something the model
// is asked to decide. That's the point: asking the model to judge
// "is this the total or the per-unit price, do I divide or not" turned
// out to be an unreliable judgment call in practice — correct on a
// receipt's first ~15 lines, then silently inconsistent for the rest (see
// the comment on receipt-extract's route for the real scan that surfaced
// this). Transcribing the numbers it sees, without having to decide what
// they mean, is a plain read — a task models are much more consistently
// accurate at, including late in a long list.
//
// One number on the line: that number IS the line's total (most
// receipts). Two numbers: the first is claimed to be the per-unit price,
// the last the line's total — cross-checked against each other, since
// the model reporting both numbers accurately (even if it doesn't know
// which is which) is far more reliable than it deciding whether to divide.
export function resolveLinePrice(quantity: number, numbers: number[]): { price: number; reconciles: boolean } {
  if (numbers.length === 0) return { price: 0, reconciles: false };
  if (numbers.length === 1) {
    // Nothing to cross-check a single number against — trust it.
    return { price: Math.round((numbers[0] / quantity) * 100) / 100, reconciles: true };
  }
  const claimedPrice = numbers[0];
  const claimedTotal = numbers[numbers.length - 1];
  const expectedTotal = Math.round(claimedPrice * quantity * 100) / 100;
  // A cent or two of tolerance for real-world rounding on the receipt
  // itself, plus a proportional allowance for larger amounts.
  const tolerance = Math.max(0.02, Math.abs(claimedTotal) * 0.02);
  const reconciles = Math.abs(expectedTotal - claimedTotal) <= tolerance;
  return { price: claimedPrice, reconciles };
}

// Converts raw item entries into ResolvedItems. Each entry is expected to
// be a `{name, quantity, numbers}` object — see resolveLinePrice above for
// why `numbers` (raw, undecided) replaced asking the model for a single
// pre-computed `price`. Two older shapes are still tolerated defensively:
// a `{name, price, quantity?}` object (in case the model reverts to
// reporting a computed price despite the prompt) and a `[name, price,
// quantity?]` positional array (an even older shape, tried and reverted —
// see the note on receipt-extract's route). No reason to throw an entry
// away just because the model produced a different valid-looking shape on
// a given call than the one just asked for.
//
// Same tolerance normalizeItems (lib/expenses.ts) itself has downstream:
// an unusable entry is dropped, not treated as a reason to fail the whole
// list.
export function itemEntriesToObjects(itemsRaw: unknown[]): ResolvedItem[] {
  const result: ResolvedItem[] = [];
  for (const entry of itemsRaw) {
    if (Array.isArray(entry)) {
      // Oldest tolerated shape: [name, price, quantity?].
      const [name, price, quantity] = entry;
      if (typeof name !== "string" || typeof price !== "number" || !Number.isFinite(price)) continue;
      const q = typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0 ? quantity : undefined;
      result.push({ name, price, quantity: q !== 1 ? q : undefined, priceUncertain: false });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;

    const obj = entry as Record<string, unknown>;
    if (typeof obj.name !== "string") continue;
    const name = obj.name;
    const rawQuantity = obj.quantity;
    const quantity = typeof rawQuantity === "number" && Number.isFinite(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1;

    if (Array.isArray(obj.numbers)) {
      const numbers = obj.numbers.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
      if (numbers.length === 0) continue;
      const resolved = resolveLinePrice(quantity, numbers);
      result.push({
        name,
        price: resolved.price,
        quantity: quantity !== 1 ? quantity : undefined,
        priceUncertain: !resolved.reconciles,
      });
      continue;
    }

    // Older tolerated shape: a direct, pre-computed `price` field.
    if (typeof obj.price === "number" && Number.isFinite(obj.price)) {
      result.push({ name, price: obj.price, quantity: quantity !== 1 ? quantity : undefined, priceUncertain: false });
    }
  }
  return result;
}
