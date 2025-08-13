import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type GenerateBody = {
  model?: string;
  prompt: string;
  n?: number;
  response_format?: "url" | "b64_json";
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-xai-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing xAI API key (x-xai-api-key header)." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as GenerateBody;
    const { model = "grok-2-image", prompt, n = 1, response_format = "url" } = body || {};

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const upstream = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, prompt, n, response_format }),
    });

    const contentType = upstream.headers.get("Content-Type") || "application/json";
    if (!upstream.ok) {
      const errText = await upstream.text();
      return new NextResponse(errText, { status: upstream.status, headers: { "Content-Type": contentType } });
    }

    return new NextResponse(upstream.body, { status: 200, headers: { "Content-Type": contentType } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


