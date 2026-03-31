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

export async function createRoom(options: CreateRoomOptions = {}): Promise<CreateRoomResponse> {
  const response = await fetch("/api/videosdk/create-room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create room");
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
