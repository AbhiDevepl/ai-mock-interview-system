import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    if (!env.VIDEOSDK_API_KEY || !env.VIDEOSDK_SECRET_KEY) {
      return NextResponse.json(
        { error: "VideoSDK credentials not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { roomId, permissions = ["allow_join"] } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 }
      );
    }

    const payload = {
      apikey: env.VIDEOSDK_API_KEY,
      permissions,
      version: 2,
      roles: ["CRAWLER"]
    };

    const token = require("jsonwebtoken").sign(payload, env.VIDEOSDK_SECRET_KEY, {
      expiresIn: "24h",
      algorithm: "HS256"
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    console.error("Error getting token:", error);
    return NextResponse.json(
      { error: "Failed to get token" },
      { status: 500 }
    );
  }
}
