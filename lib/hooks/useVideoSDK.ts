"use client";

import { useState, useCallback, useEffect } from "react";
import { getToken, createRoom, GetTokenResponse, CreateRoomResponse } from "@/lib/services/videosdk.service";

interface UseVideoSDKOptions {
  autoConnect?: boolean;
}

interface UseVideoSDKReturn {
  token: string | null;
  roomId: string | null;
  isLoading: boolean;
  error: string | null;
  createNewRoom: () => Promise<CreateRoomResponse>;
  fetchToken: (roomId: string) => Promise<GetTokenResponse>;
  reset: () => void;
}

export function useVideoSDK(options: UseVideoSDKOptions = {}): UseVideoSDKReturn {
  const { autoConnect = false } = options;
  
  const [token, setToken] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewRoom = useCallback(async (): Promise<CreateRoomResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createRoom();
      setRoomId(result.roomId);
      const tokenResult = await getToken({ roomId: result.roomId });
      setToken(tokenResult.token);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create room";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchToken = useCallback(async (roomIdToFetch: string): Promise<GetTokenResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getToken({ roomId: roomIdToFetch });
      setToken(result.token);
      setRoomId(roomIdToFetch);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get token";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setRoomId(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (autoConnect && roomId && !token) {
      fetchToken(roomId);
    }
  }, [autoConnect, roomId, token, fetchToken]);

  return {
    token,
    roomId,
    isLoading,
    error,
    createNewRoom,
    fetchToken,
    reset,
  };
}
