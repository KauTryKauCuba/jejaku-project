import { NextRequest, NextResponse } from "next/server";
import { EXPENSE_CATEGORIES } from "../../lib/expenses";

type ExtractedItem = { name: string; price: number };

type Extracted = {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  category: (typeof EXPENSE_CATEGORIES)[number] | null;
  location: string | null;
  currency: string | null;
  items: ExtractedItem[];
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
                "Read this photo of a receipt and extract its details. " +
                "Respond with ONLY a JSON object, no other text, in exactly this shape: " +
                '{"merchant":"...","amount":0,"date":"YYYY-MM-DD","category":"...","location":"...","currency":"...","items":[{"name":"...","price":0}]} ' +
                "merchant: the store/business name as printed. " +
                "amount: the final total paid, as a plain number (no currency symbol). " +
                `date: the transaction date in YYYY-MM-DD format. If no date is printed, use today's date, ${today}. ` +
                `category: pick the single best fit from exactly this list: ${categoryList}. ` +
                "location: the store's printed address or branch (street address, city, or branch name/number) " +
                "— whatever identifies which specific location this is, as printed. Not the merchant's name again. " +
                "currency: the 3-letter ISO 4217 currency code for whatever currency this receipt is priced in " +
                "(e.g. USD, MYR, EUR, GBP, JPY, SGD) — infer it from the printed symbol/code, or from the store's " +
                "address/language if no symbol is legible. " +
                "items: every line item printed on the receipt, each with its own name and price as a plain " +
                "number. Skip subtotal/tax/tip/total lines — those aren't items. If no individual items can be " +
                "read, use an empty array. " +
                "If a field genuinely cannot be determined, use null for it (items is always an array, never null).",
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
    location: null,
    currency: null,
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
    const location = typeof parsed.location === "string" ? parsed.location : null;
    const currency =
      typeof parsed.currency === "string" && CURRENCY_CODE_PATTERN.test(parsed.currency.toUpperCase())
        ? parsed.currency.toUpperCase()
        : null;
    const items: ExtractedItem[] = Array.isArray(parsed.items)
      ? parsed.items.filter(
          (item: unknown): item is ExtractedItem =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as ExtractedItem).name === "string" &&
            typeof (item as ExtractedItem).price === "number" &&
            Number.isFinite((item as ExtractedItem).price)
        )
      : [];
    return NextResponse.json({ merchant, amount, date, category, location, currency, items } satisfies Extracted);
  } catch {
    return NextResponse.json(empty);
  }
}
