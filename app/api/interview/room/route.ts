import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Please use /api/videosdk/create-room to create a room",
  });
}
