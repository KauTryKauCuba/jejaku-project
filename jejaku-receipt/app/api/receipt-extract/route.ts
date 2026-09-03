import { NextRequest, NextResponse } from "next/server";
import { EXPENSE_CATEGORIES, normalizeItems, type ExpenseItem } from "../../lib/expenses";

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
};

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export async function POST(req: NextRequest) {
  const { image } = (await req.json()) as { image?: string };
  if (!image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
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
    return NextResponse.json({ merchant, amount, date, category, city, state, country, currency, tax, items } satisfies Extracted);
  } catch {
    return NextResponse.json(empty);
  }
}
