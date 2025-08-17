import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-xai-api-key");
    
    if (!apiKey) {
      return NextResponse.json(
        { status: "no-key", message: "No API key provided" },
        { status: 200 }
      );
    }

    // Test the API key by making a minimal request to the xAI API
    const upstream = await fetch("https://api.x.ai/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (upstream.status === 401) {
      return NextResponse.json(
        { status: "invalid", message: "Invalid API key" },
        { status: 200 }
      );
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { status: "error", message: `API error: ${upstream.status}` },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: "connected", message: "Connected to xAI API" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message: `Connection failed: ${message}` },
      { status: 200 }
    );
  }
}
