import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import jwt from "jsonwebtoken";

async function safeJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
  }
  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    if (!env.VIDEOSDK_API_KEY || !env.VIDEOSDK_SECRET_KEY) {
      console.error("[VideoSDK] Missing credentials:", {
        hasApiKey: !!env.VIDEOSDK_API_KEY,
        hasSecretKey: !!env.VIDEOSDK_SECRET_KEY,
      });
      return NextResponse.json(
        { error: "VideoSDK credentials not configured", message: "VIDEOSDK_API_KEY or VIDEOSDK_SECRET_KEY is missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { customRoomId, maxParticipants = 2 } = body;

    const payload = {
      apikey: env.VIDEOSDK_API_KEY,
      permissions: ["allow_join", "allow_modify"],
    };

    const token = jwt.sign(payload, env.VIDEOSDK_SECRET_KEY, {
      expiresIn: "1h",
      algorithm: "HS256"
    });

    console.log("[VideoSDK] Creating room with:", { customRoomId, maxParticipants });

    const response = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customRoomId: customRoomId || undefined,
        maxParticipants,
        autoClose: true,
      }),
    });

    console.log("[VideoSDK] Response status:", response.status);

    if (!response.ok) {
      const error = await safeJson(response);
      console.error("[VideoSDK] API error:", error);
      return NextResponse.json(
        { error: error.error || error.message || "Failed to create room", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[VideoSDK] Room created:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[VideoSDK] Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
