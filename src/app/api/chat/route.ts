import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-xai-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing xAI API key (x-xai-api-key header)." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      model = "grok-4-0709",
      messages,
      temperature = 0.7,
      max_tokens,
      stream = false,
    } = body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Body must include messages: Array<{ role, content }>." },
        { status: 400 }
      );
    }

    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens, stream }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return new NextResponse(errText, {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("Content-Type") || "text/plain" },
      });
    }

    // Pass through body. If stream=true, this will be SSE (text/event-stream).
    const contentType = upstream.headers.get("Content-Type") || (stream ? "text/event-stream" : "application/json");
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-transform",
    };
    if (contentType.includes("text/event-stream")) {
      headers.Connection = "keep-alive";
    }
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


