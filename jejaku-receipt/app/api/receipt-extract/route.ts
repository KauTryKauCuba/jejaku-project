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
  //
  // Items ask for raw `numbers` per line, not a computed price — a real
  // scan against 5 receipts (all using the same "quantity, per-unit
  // PRICE, separate AMOUNT" layout) showed the model correctly divide-vs-
  // not for the first ~15 lines, then get 10 of the next 11 multi-
  // quantity lines wrong, reporting the AMOUNT as if it were the price.
  // That's not a comprehension gap (it read the rule right 15 times in a
  // row) — it's a consistency-under-repetition problem, and rewording the
  // rule doesn't fix a rule the model already demonstrably knows how to
  // follow. What does: stop asking it to decide. Report the numbers as
  // printed, in order, and let resolveLinePrice (lib/receiptExtractParse)
  // do the division deterministically in code — and cross-check the two
  // numbers against each other when both are present, catching exactly
  // the failure this replaced (see priceUncertain there).
  const instructions =
    "Read this receipt as ONLY a JSON object, no other text, in exactly this shape: " +
    '{"merchant":"...","amount":0,"date":"YYYY-MM-DD","category":"...","city":"...","state":"...","country":"...","currency":"...","tax":0,"items":[{"name":"...","quantity":1,"numbers":[0]}]} ' +
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
    "items: for each line, report its name, quantity (integer ≥1; use 1 for weight/measure-sold " +
    "items, see below), and numbers: every price-like number printed on the line after quantity, IN " +
    "THE ORDER PRINTED, as plain numbers. Do not compute or divide anything yourself — just transcribe " +
    "what's printed. Most receipts print ONE number per line (the line's total) — report that single " +
    "number. Some print TWO — a per-unit price AND a separate line total/amount — report both, price " +
    "first then total, in that order. " +
    "The FIRST item line is the one most likely to have its quantity and the number(s) after it run " +
    "together, before you've settled into this receipt's column spacing — read it especially " +
    "carefully; quantity and the price/total numbers are separate values even when printed close " +
    "together. " +
    "For items sold by weight/measure (e.g. \"0.85kg @ 2.99/kg\"), use quantity 1 and report the " +
    "single number that's the actual amount paid, not the per-kg/per-unit rate. " +
    "A number may have a trailing tax-code letter printed directly after it with no space (e.g. " +
    "23.00Z, 8.60S) — that's a tax category code, not part of the number; report only the numeric " +
    "value. A discount/rebate line (usually a negative amount tied to the item above it) is its own " +
    "item — name it for what it is (e.g. \"Discount\"), quantity 1, numbers a single negative amount. " +
    "An item's name may wrap across two printed lines before its numbers appear — read the full " +
    "wrapped text as one item name. " +
    "Combo/bundle lines may list included items indented below with no numbers of their own — skip " +
    "those, keep only the parent line. Skip subtotal/tax/tip/total lines. Empty array if none " +
    "readable. " +
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
  const resolvedItems = itemEntriesToObjects(itemsRaw);
  const items = normalizeItems(resolvedItems);
  // Two independent signals, both folded into one flag the UI already
  // knows how to show (see lib/receiptScanStatus.ts): the whole-receipt
  // aggregate check (items + tax vs. the printed total), and now also a
  // per-line check — any single item whose own printed numbers didn't
  // reconcile with each other (see resolveLinePrice) trips this too, even
  // when the aggregate happens to still look fine.
  const itemsMismatch = computeItemsMismatch(items, tax, amount) || resolvedItems.some((i) => i.priceUncertain);
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
