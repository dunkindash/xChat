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
    const { images, prompt = "", model = "grok-2v", detail = "high" } = body ?? {} as {
      images?: string[];
      prompt?: string;
      model?: string;
      detail?: "low" | "high";
    };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Body must include images: string[] of data URLs or URLs." },
        { status: 400 }
      );
    }

    // Build messages according to xAI image understanding schema with multiple images
    type VisionContent =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" } };

    const content: VisionContent[] = [{ type: "text", text: prompt || "Describe the image(s)." }];
    for (const img of images) {
      content.push({ type: "image_url", image_url: { url: img, detail } });
    }
    const messages = [
      {
        role: "user",
        content,
      },
    ];

    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return new NextResponse(errText, {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("Content-Type") || "text/plain" },
      });
    }

    const contentType = upstream.headers.get("Content-Type") || "application/json";
    return new NextResponse(upstream.body, { status: 200, headers: { "Content-Type": contentType } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


