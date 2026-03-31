// Simple GET endpoint that returns the room ID and token
// so frontend can fetch them without exposing in client bundle
export async function GET() {
  return Response.json({
    roomId: process.env.NEXT_PUBLIC_VIDEOSDK_ROOM_ID,
    token: process.env.NEXT_PUBLIC_VIDEOSDK_TOKEN,
  });
}
