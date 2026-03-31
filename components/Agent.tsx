"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  MeetingProvider,
  useMeeting,
  usePubSub,
} from "@videosdk.live/react-sdk";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface AgentProps {
  userName: string;
  roomId: string;
  token: string;
}

// ── Inner component (must be inside MeetingProvider) ─────────────────────────

const MeetingView = ({
  userName,
  callStatus,
  setCallStatus,
}: {
  userName: string;
  callStatus: CallStatus;
  setCallStatus: (s: CallStatus) => void;
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const { join, leave, participants } = useMeeting({
    onMeetingJoined: () => {
      setCallStatus(CallStatus.ACTIVE);
      toast.success("Joined interview room");
    },
    onMeetingLeft: () => {
      setCallStatus(CallStatus.FINISHED);
      toast.info("Left interview room");
    },
    onParticipantJoined: (participant) => {
      if (participant.displayName === "AI Interviewer") {
        toast.success("AI Interviewer joined!");
      }
    },
    onSpeakerChanged: (activeSpeakerId) => {
      if (activeSpeakerId) {
        const participant = participants.get(activeSpeakerId);
        setIsSpeaking(participant?.displayName === "AI Interviewer");
      } else {
        setIsSpeaking(false);
      }
    },
  });

  usePubSub("CHAT", {
    onMessageReceived: (message) => {
      setMessages((prev) => [...prev, message.message as string]);
    },
  });

  const lastMessage = messages[messages.length - 1] ?? "";

  return (
    <>
      <div className="call-view">
        {/* AI interviewer card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User card */}
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

      {/* Transcript */}
      {lastMessage && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Call controls */}
      <div className="w-full flex justify-center mt-4">
        {callStatus !== CallStatus.ACTIVE ? (
          <button
            id="btn-join-call"
            className="btn-call relative"
            disabled={callStatus === CallStatus.CONNECTING}
            onClick={() => {
              setCallStatus(CallStatus.CONNECTING);
              join();
            }}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />
            <span>
              {callStatus === CallStatus.CONNECTING ? ". . ." : "Join Interview"}
            </span>
          </button>
        ) : (
          <button
            id="btn-leave-call"
            className="btn-disconnect"
            onClick={() => {
              leave();
              setCallStatus(CallStatus.FINISHED);
            }}
          >
            End
          </button>
        )}
      </div>
    </>
  );
};

// ── Public component ──────────────────────────────────────────────────────────

export default function Agent({ userName, roomId, token }: AgentProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);

  return (
    <MeetingProvider
      config={{
        meetingId: roomId,
        micEnabled: true,
        webcamEnabled: false,
        name: userName,
        mode: "SEND_AND_RECV",
        debugMode: false,
      }}
      token={token}
    >
      <MeetingView
        userName={userName}
        callStatus={callStatus}
        setCallStatus={setCallStatus}
      />
    </MeetingProvider>
  );
}
