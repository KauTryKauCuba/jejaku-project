import { NextRequest, NextResponse } from "next/server";
import { EXPENSE_CATEGORIES, normalizeItems, type ExpenseItem } from "../../lib/expenses";
import { computeItemsMismatch } from "../../lib/receiptSanity";
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
};

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { image } = (await req.json()) as { image?: string };
  if (!image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  // Rough decoded size from the base64 payload's own length (~4/3 the size
  // of the bytes it encodes) rather than actually decoding it — cheap, and
  // precise enough for a ceiling. Mirrors the size cap saveExpensePhoto
  // enforces on an uploaded file, so this route can't be used to bill
  // DeepSeek for an image far larger than anything the app would ever
  // actually store.
  const commaIndex = image.indexOf(",");
  const base64Payload = commaIndex === -1 ? image : image.slice(commaIndex + 1);
  const approxDecodedBytes = (base64Payload.length * 3) / 4;
  if (approxDecodedBytes > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: "Image is too large." }, { status: 413 });
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
      // Bumped from 500: an itemized list is real extra output tokens on
      // top of the four scalar fields, and a truncated response comes back
      // as invalid JSON — see the earlier max_tokens bug on this route.
      max_tokens: 900,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Read this receipt photo and extract its details as ONLY a JSON object, no other text, in " +
                "exactly this shape: " +
                '{"merchant":"...","amount":0,"date":"YYYY-MM-DD","category":"...","city":"...","state":"...","country":"...","currency":"...","tax":0,"items":[{"name":"...","price":0,"quantity":1}]} ' +
                "merchant: real business name as printed, never a bare number/code/ID — if illegible (glare, " +
                "creases, fading), null rather than guessing. " +
                "amount: final total paid, plain number, no currency symbol. " +
                `date: YYYY-MM-DD; if none printed, use today, ${today}. ` +
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
                "null for any field that truly can't be determined (items is always an array, never null).",
            },
            {
              type: "image_url",
              image_url: { url: image },
            },
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
  };

  if (!res.ok) {
    console.error("[receipt-extract] DeepSeek request failed", res.status, await res.text());
    return NextResponse.json({ error: "Extraction request failed" }, { status: 502 });
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json(empty);
  }

  try {
    const parsed = JSON.parse(match[0]);
    const merchant = typeof parsed.merchant === "string" ? parsed.merchant : null;
    const amount = typeof parsed.amount === "number" && Number.isFinite(parsed.amount) ? parsed.amount : null;
    const date = typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null;
    const category = EXPENSE_CATEGORIES.includes(parsed.category) ? parsed.category : null;
    const city = typeof parsed.city === "string" ? parsed.city : null;
    const state = typeof parsed.state === "string" ? parsed.state : null;
    const country = typeof parsed.country === "string" ? parsed.country : null;
    const tax = typeof parsed.tax === "number" && Number.isFinite(parsed.tax) ? parsed.tax : null;
    const currency =
      typeof parsed.currency === "string" && CURRENCY_CODE_PATTERN.test(parsed.currency.toUpperCase())
        ? parsed.currency.toUpperCase()
        : null;
    const items = normalizeItems(parsed.items);
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
    } satisfies Extracted);
  } catch {
    return NextResponse.json(empty);
  }
}
