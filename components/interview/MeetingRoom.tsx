"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface MeetingRoomProps {
  token: string;
  roomId: string;
  userName: string;
  onLeave: () => void;
}

export function MeetingRoom({ token, roomId, userName, onLeave }: MeetingRoomProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [agentJoined, setAgentJoined] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const { join, leave, participants } = useMeeting({
    onMeetingJoined: () => {
      setCallStatus(CallStatus.ACTIVE);
      toast.success("Joined interview room");
    },
    onMeetingLeft: () => {
      setCallStatus(CallStatus.FINISHED);
      toast.info("Left interview room");
      onLeave();
    },
    onParticipantJoined: (participant) => {
      if (participant.displayName === "AI Interviewer") {
        setAgentJoined(true);
        toast.success("AI Interviewer joined!");
      }
    },
    onParticipantLeft: (participant) => {
      if (participant.displayName === "AI Interviewer") {
        setAgentJoined(false);
        setIsAgentSpeaking(false);
      }
    },
    onSpeakerChanged: (activeSpeakerId) => {
      if (activeSpeakerId) {
        const participant = participants.get(activeSpeakerId);
        if (participant?.displayName === "AI Interviewer") {
          setIsAgentSpeaking(true);
        } else {
          setIsAgentSpeaking(false);
        }
      } else {
        setIsAgentSpeaking(false);
      }
    },
  });

  usePubSub("CHAT", {
    onMessageReceived: (message) => {
      setMessages((prev) => [...prev, message.message as string]);
    },
  });

  useEffect(() => {
    if (callStatus === CallStatus.INACTIVE) {
      join();
    }
  }, [callStatus, join]);

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : "";

  return (
    <div className="space-y-6 p-6">
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer"
              width={65}
              height={54}
              className="object-cover"
            />
            {isAgentSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            agentJoined ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
          )}>
            {agentJoined ? "Connected" : "Waiting..."}
          </span>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="user avatar"
              width={540}
              height={540}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {lastMessage && (
        <div className="transcript-border">
          <div className="transcript">
            <p className="animate-fadeIn">{lastMessage}</p>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        {callStatus !== CallStatus.FINISHED ? (
          <button
            className="btn-disconnect"
            onClick={() => {
              leave();
              setCallStatus(CallStatus.FINISHED);
            }}
          >
            End Interview
          </button>
        ) : (
          <Button onClick={onLeave}>Return to Results</Button>
        )}
      </div>
    </div>
  );
}
