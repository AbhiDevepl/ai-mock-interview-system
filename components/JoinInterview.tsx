"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useVideoSDK } from "@/lib/hooks/useVideoSDK";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface JoinInterviewProps {
  onJoin?: (roomId: string) => void;
}

export function JoinInterview({ onJoin }: JoinInterviewProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const { fetchToken, isLoading, error } = useVideoSDK();

  const handleJoin = async () => {
    if (!roomId.trim()) {
      toast.error("Please enter a room ID");
      return;
    }

    try {
      await fetchToken(roomId);
      if (onJoin) {
        onJoin(roomId);
      }
      router.push(`/interview/meeting/${roomId}`);
    } catch {
      toast.error("Failed to join room");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Room ID</label>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter room ID to join"
          className="w-full p-2.5 rounded-lg border bg-background"
        />
      </div>
      <Button onClick={handleJoin} disabled={isLoading || !roomId.trim()} className="w-full">
        {isLoading ? "Joining..." : "Join Interview"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
