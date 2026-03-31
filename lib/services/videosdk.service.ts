export interface CreateRoomOptions {
  customRoomId?: string;
  maxParticipants?: number;
}

export interface CreateRoomResponse {
  roomId: string;
  token: string;
  createdAt: string;
}

export interface GetTokenOptions {
  roomId: string;
  permissions?: ("allow_join" | "allow_modify")[];
}

export interface GetTokenResponse {
  token: string;
  expiresAt: string;
}

async function safeJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Server error (${response.status}): ${text.slice(0, 200)}`);
  }
  return response.json();
}

export async function createRoom(options: CreateRoomOptions = {}): Promise<CreateRoomResponse> {
  const response = await fetch("/api/videosdk/create-room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await safeJson(response);
    console.error("[createRoom] Error:", error);
    throw new Error(error.message || error.error || `Failed to create room (${response.status})`);
  }

  return response.json();
}

export async function getToken(options: GetTokenOptions): Promise<GetTokenResponse> {
  const response = await fetch("/api/videosdk/get-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get token");
  }

  return response.json();
}
