"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MeetingProvider, useMeeting, useParticipant, usePubSub, Constants } from "@videosdk.live/react-sdk";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface AgentProps {
  userName: string;
  userEmail?: string;
  userId?: string;
  type?: "generate" | "interview";
}

const MeetingView = ({ userName, callStatus, setCallStatus }: any) => {
  const [agentJoined, setAgentJoined] = useState(false);
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
        setAgentJoined(true);
        toast.success("AI Interviewer joined!");
      }
    },
    onParticipantLeft: (participant) => {
      if (participant.displayName === "AI Interviewer") {
        setAgentJoined(false);
        setIsSpeaking(false);
      }
    },
    onSpeakerChanged: (activeSpeakerId) => {
      if (activeSpeakerId) {
        const participant = participants.get(activeSpeakerId);
        if (participant?.displayName === "AI Interviewer") {
          setIsSpeaking(true);
        } else {
          setIsSpeaking(false);
        }
      } else {
        setIsSpeaking(false);
      }
    }
  });

  usePubSub("CHAT", {
    onMessageReceived: (message) => {
      setMessages((prev: string[]) => [...prev, message.message as string]);
    }
  });

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : "";

  return (
    <>
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
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
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

      <div className="w-full flex justify-center mt-4">
        {callStatus !== CallStatus.ACTIVE ? (
          <button 
            className="btn-call relative" 
            disabled={callStatus === CallStatus.CONNECTING}
            onClick={() => { setCallStatus(CallStatus.CONNECTING); join(); }}
          >
             <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />
            <span>{callStatus === CallStatus.CONNECTING ? ". . ." : "Call"}</span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => { leave(); setCallStatus(CallStatus.FINISHED); }}>
            End
          </button>
        )}
      </div>
    </>
  );
};

const Agent = ({ userName, userEmail, userId, type }: AgentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);

  const token = process.env.NEXT_PUBLIC_VIDEOSDK_TOKEN || "";
  const meetingId = process.env.NEXT_PUBLIC_VIDEOSDK_ROOM_ID || "";

  return (
    <MeetingProvider
      config={{
        meetingId,
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
};

export default Agent;
