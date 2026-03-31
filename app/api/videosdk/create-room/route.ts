import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    if (!env.VIDEOSDK_API_KEY || !env.VIDEOSDK_SECRET_KEY) {
      return NextResponse.json(
        { error: "VideoSDK credentials not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { customRoomId, maxParticipants = 2 } = body;

    const payload = {
      apikey: env.VIDEOSDK_API_KEY,
      permissions: ["allow_join", "allow_mod"],
    };

    const token = jwt.sign(payload, env.VIDEOSDK_SECRET_KEY, {
      expiresIn: "1h",
      algorithm: "HS256"
    });

    const response = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customRoomId: customRoomId || undefined,
        maxParticipants,
        autoClose: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
