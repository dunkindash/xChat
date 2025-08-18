import { NextRequest, NextResponse } from "next/server";
import { storeApiKey, getApiKey, deleteApiKey } from "@/lib/database";

export const runtime = "nodejs";

/**
 * Store an API key for a user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userIdentifier, apiKey } = body;

    if (!userIdentifier || !apiKey) {
      return NextResponse.json(
        { error: "Missing userIdentifier or apiKey" },
        { status: 400 }
      );
    }

    // Validate API key format (basic validation)
    if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 400 }
      );
    }

    await storeApiKey(userIdentifier, apiKey.trim());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API key storage error:', error);
    return NextResponse.json(
      { error: "Failed to store API key" },
      { status: 500 }
    );
  }
}

/**
 * Retrieve an API key for a user
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdentifier = searchParams.get('userIdentifier');

    if (!userIdentifier) {
      return NextResponse.json(
        { error: "Missing userIdentifier parameter" },
        { status: 400 }
      );
    }

    const apiKey = await getApiKey(userIdentifier);

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error('API key retrieval error:', error);
    return NextResponse.json(
      { error: "Failed to retrieve API key" },
      { status: 500 }
    );
  }
}

/**
 * Delete an API key for a user
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdentifier = searchParams.get('userIdentifier');

    if (!userIdentifier) {
      return NextResponse.json(
        { error: "Missing userIdentifier parameter" },
        { status: 400 }
      );
    }

    const deleted = await deleteApiKey(userIdentifier);

    if (!deleted) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API key deletion error:', error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
