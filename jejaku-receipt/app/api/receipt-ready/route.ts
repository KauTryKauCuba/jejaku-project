import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { image } = (await req.json()) as { image?: string };
  if (!image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured" }, { status: 500 });
  }

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash-vision-exp",
      temperature: 0,
      // No precise coordinates needed here, just a yes/no — thinking mode
      // adds seconds of latency for no benefit on a call this simple.
      thinking: { type: "disabled" },
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "This is a live camera frame from someone about to photograph a receipt. " +
                "Respond with ONLY a JSON object, no other text: " +
                '{"ready":true} if a single receipt or paper document is fully visible within ' +
                "the frame (not cut off at any edge), right-side up, reasonably in focus, and " +
                'takes up a meaningful portion of the image. Respond {"ready":false} if no ' +
                "document is visible, it's partially out of frame, badly blurred, or a hand is " +
                "covering it.",
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
    return NextResponse.json({ ready: false });
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ ready: false });
  }

  try {
    const parsed = JSON.parse(match[0]) as { ready?: boolean };
    return NextResponse.json({ ready: parsed.ready === true });
  } catch {
    return NextResponse.json({ ready: false });
  }
}
