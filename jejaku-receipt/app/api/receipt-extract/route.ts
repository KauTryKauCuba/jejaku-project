import { NextRequest, NextResponse } from "next/server";
import { EXPENSE_CATEGORIES, normalizeItems, type ExpenseItem } from "../../lib/expenses";
import { computeItemsMismatch } from "../../lib/receiptSanity";
import { parseReceiptResponse, itemEntriesToObjects } from "../../lib/receiptExtractParse";
import { getCurrentUser } from "../../lib/currentUser";
import { MAX_UPLOAD_SIZE_BYTES } from "../../lib/uploads";

// This is the one route in the app that bills a real per-call cost
// (DeepSeek vision) and — unlike every other mutating route — had no auth
// check at all: the endpoint ships in the client bundle, so it's public
// surface, not a secret URL. `getCurrentUser` is the real gate (raises the
// bar from "anyone with curl" to "a verified, otp-confirmed account"); the
// two checks below it are hardening behind that gate, not the primary
// defense.

// Soft per-user cap on scans per calendar day, to catch a runaway loop or
// a compromised session rather than to be an airtight quota. In-memory
// and scoped to this server process — same tradeoff as exchangeRates.ts's
// rate cache — so it resets on a deploy/restart; that's rare and fine for
// a cap this generous (no real user comes close to it in a day).
const DAILY_SCAN_LIMIT = 50;
const scanCountsByUser = new Map<string, { day: string; count: number }>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Returns false once a user has hit today's cap; otherwise records this
// scan against their count and returns true.
function recordScanAndCheckLimit(userId: string): boolean {
  const day = todayKey();
  const entry = scanCountsByUser.get(userId);
  if (!entry || entry.day !== day) {
    scanCountsByUser.set(userId, { day, count: 1 });
    return true;
  }
  if (entry.count >= DAILY_SCAN_LIMIT) return false;
  entry.count += 1;
  return true;
}

type Extracted = {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  category: (typeof EXPENSE_CATEGORIES)[number] | null;
  city: string | null;
  state: string | null;
  country: string | null;
  currency: string | null;
  tax: number | null;
  items: ExpenseItem[];
  // True when the extracted items + tax don't reasonably add up to the
  // extracted amount — see computeItemsMismatch in lib/receiptSanity.ts.
  itemsMismatch: boolean;
  // True when the model's response was cut off before finishing — a long
  // item list is the case most likely to hit this, and it's a different
  // situation from itemsMismatch: the numbers can't be expected to
  // reconcile when part of the receipt was never actually read, rather
  // than misread. See lib/receiptExtractParse.ts for how this is detected
  // and what gets salvaged from a truncated response.
  itemsTruncated: boolean;
};

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

// A ceiling on image parts per request — defense in depth so a modified
// or compromised client can't send an arbitrarily large batch of images
// through this route. Whatever client-side splitting eventually decides
// how many parts a long receipt gets should stay under this.
const MAX_IMAGES = 8;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { images?: unknown };
  const images = Array.isArray(body.images) ? body.images.filter((i): i is string => typeof i === "string") : [];
  if (images.length === 0) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }
  if (images.length > MAX_IMAGES) {
    return NextResponse.json({ error: "Too many image parts." }, { status: 400 });
  }

  // Rough decoded size from each base64 payload's own length (~4/3 the
  // size of the bytes it encodes) rather than actually decoding it —
  // cheap, and precise enough for a ceiling. Mirrors the size cap
  // saveExpensePhoto enforces on an uploaded file, applied per image so a
  // multi-tile request can't smuggle through anything larger, tile for
  // tile, than a single scan ever could.
  for (const image of images) {
    const commaIndex = image.indexOf(",");
    const base64Payload = commaIndex === -1 ? image : image.slice(commaIndex + 1);
    const approxDecodedBytes = (base64Payload.length * 3) / 4;
    if (approxDecodedBytes > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: "Image is too large." }, { status: 413 });
    }
  }

  if (!recordScanAndCheckLimit(user.id)) {
    return NextResponse.json({ error: "Daily scan limit reached. Try again tomorrow." }, { status: 429 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured" }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const categoryList = EXPENSE_CATEGORIES.join(", ");

  // The static instruction block is built to be byte-identical across
  // every request regardless of image count, with the one value that
  // actually changes daily (today's date) held until the very end —
  // DeepSeek's prompt cache matches on a shared prefix, so keeping the
  // whole rules block ahead of any per-request text is what makes it
  // eligible to be served from cache instead of billed as fresh input on
  // every scan. The multi-image note is appended after that too, since it
  // only applies sometimes and would otherwise split the prefix itself.
  // The items shape is a named object, not a compact positional array —
  // a compact array format was tried here and reverted. It saved output
  // tokens, but max_tokens (3000) already gives comfortable headroom over
  // what a single image can legibly resolve anyway, so there was nothing
  // real to gain from it, and a real cost: a positional array has no
  // field-order anchor, so the model has to keep name/price/quantity
  // position exactly right with nothing reminding it mid-generation what
  // each slot means — self-documenting named keys are what it reliably
  // produces instead.
  const instructions =
    "Read this receipt as ONLY a JSON object, no other text, in exactly this shape: " +
    '{"merchant":"...","amount":0,"date":"YYYY-MM-DD","category":"...","city":"...","state":"...","country":"...","currency":"...","tax":0,"items":[{"name":"...","price":0,"quantity":1}]} ' +
    "merchant: real business name as printed, never a bare number/code/ID — if illegible (glare, " +
    "creases, fading), null rather than guessing. " +
    "amount: final total paid, plain number, no currency symbol. " +
    `category: single best fit from: ${categoryList}. ` +
    "city: store's city from the address line, not a street address or branch number. " +
    "state: only if printed; null rather than guess. " +
    "country: infer from context (language, address/phone format, currency) if not printed; null " +
    "only if there's no signal. " +
    "currency: 3-letter ISO 4217 code (USD, MYR, EUR, ...), inferred from symbol/code or the " +
    "store's address/language. " +
    "tax: printed sales tax/GST/VAT as a plain number if broken out; null if none. " +
    "items: each line's name, quantity, and PER-UNIT price. Most receipts print only quantity + one " +
    "price per line, and that price is the line's TOTAL — divide by quantity to get price whenever " +
    "quantity > 1 (skip dividing only if quantity is 1, or a separate unit/\"each\" price is shown). " +
    "Combo/bundle lines may list included items indented below with no price of their own — skip " +
    "those, keep only the parent line. quantity is an integer ≥1. Skip subtotal/tax/tip/total lines. " +
    "Empty array if none readable. " +
    "null for any field that truly can't be determined (items is always an array, never null).";

  const multiImageNote =
    images.length > 1
      ? " These images are sequential top-to-bottom slices of ONE receipt, each slightly overlapping the " +
        "next — read them as a single continuous receipt, not separate ones, and don't count a line that " +
        "appears in the overlap between two slices twice."
      : "";

  const dateNote = ` date: YYYY-MM-DD; if none printed, use today, ${today}.`;

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash-vision-exp",
      temperature: 0,
      // Thinking mode is on by default for this model and burns the token
      // budget on reasoning_content before it ever writes the answer —
      // disable it, we just want a direct structured-extraction answer.
      thinking: { type: "disabled" },
      // Raised from 900: that ceiling truncated a response somewhere
      // around 35 items, and a truncated response used to come back as
      // invalid JSON and get thrown away entirely (see the earlier
      // max_tokens bug this route already had). It's a ceiling, not a
      // reservation — a normal 10-item receipt still only costs what it
      // actually generates.
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instructions + multiImageNote + dateNote },
            ...images.map((image) => ({ type: "image_url" as const, image_url: { url: image } })),
          ],
        },
      ],
    }),
  });

  const empty: Extracted = {
    merchant: null,
    amount: null,
    date: null,
    category: null,
    city: null,
    state: null,
    country: null,
    currency: null,
    tax: null,
    items: [],
    itemsMismatch: false,
    itemsTruncated: false,
  };

  if (!res.ok) {
    console.error("[receipt-extract] DeepSeek request failed", res.status, await res.text());
    return NextResponse.json({ error: "Extraction request failed" }, { status: 502 });
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const finishReason: string | undefined = data?.choices?.[0]?.finish_reason;
  const { fields, itemsRaw, truncated } = parseReceiptResponse(text, finishReason);

  if (!fields) {
    return NextResponse.json({ ...empty, itemsTruncated: truncated } satisfies Extracted);
  }

  const merchant = typeof fields.merchant === "string" ? fields.merchant : null;
  const amount = typeof fields.amount === "number" && Number.isFinite(fields.amount) ? fields.amount : null;
  const date = typeof fields.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fields.date) ? fields.date : null;
  const category = EXPENSE_CATEGORIES.includes(fields.category as (typeof EXPENSE_CATEGORIES)[number])
    ? (fields.category as (typeof EXPENSE_CATEGORIES)[number])
    : null;
  const city = typeof fields.city === "string" ? fields.city : null;
  const state = typeof fields.state === "string" ? fields.state : null;
  const country = typeof fields.country === "string" ? fields.country : null;
  const tax = typeof fields.tax === "number" && Number.isFinite(fields.tax) ? fields.tax : null;
  const currency =
    typeof fields.currency === "string" && CURRENCY_CODE_PATTERN.test(fields.currency.toUpperCase())
      ? fields.currency.toUpperCase()
      : null;
  const items = normalizeItems(itemEntriesToObjects(itemsRaw));
  const itemsMismatch = computeItemsMismatch(items, tax, amount);
  return NextResponse.json({
    merchant,
    amount,
    date,
    category,
    city,
    state,
    country,
    currency,
    tax,
    items,
    itemsMismatch,
    itemsTruncated: truncated,
  } satisfies Extracted);
}
