import { NextRequest, NextResponse } from "next/server";
import { EXPENSE_CATEGORIES } from "../../lib/expenses";

type Extracted = {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  category: (typeof EXPENSE_CATEGORIES)[number] | null;
};

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
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Read this photo of a receipt and extract its details. " +
                "Respond with ONLY a JSON object, no other text, in exactly this shape: " +
                '{"merchant":"...","amount":0,"date":"YYYY-MM-DD","category":"..."} ' +
                "merchant: the store/business name as printed. " +
                "amount: the final total paid, as a plain number (no currency symbol). " +
                `date: the transaction date in YYYY-MM-DD format. If no date is printed, use today's date, ${today}. ` +
                `category: pick the single best fit from exactly this list: ${categoryList}. ` +
                "If a field genuinely cannot be determined, use null for it.",
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

  if (!res.ok) {
    console.error("[receipt-extract] DeepSeek request failed", res.status, await res.text());
    return NextResponse.json({ error: "Extraction request failed" }, { status: 502 });
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ merchant: null, amount: null, date: null, category: null } satisfies Extracted);
  }

  try {
    const parsed = JSON.parse(match[0]);
    const merchant = typeof parsed.merchant === "string" ? parsed.merchant : null;
    const amount = typeof parsed.amount === "number" && Number.isFinite(parsed.amount) ? parsed.amount : null;
    const date = typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null;
    const category = EXPENSE_CATEGORIES.includes(parsed.category) ? parsed.category : null;
    return NextResponse.json({ merchant, amount, date, category } satisfies Extracted);
  } catch {
    return NextResponse.json({ merchant: null, amount: null, date: null, category: null } satisfies Extracted);
  }
}
