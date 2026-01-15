import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

enum CallStatus {
  INACTIVE = "inactive",
  ACTIVE = "active",
  CONNECTING = "connecting",
  FINISHED = "finished",
}

interface AgentProps {
  userName: string;
  userId?: string;
  type?: string;
}

const Agent = ({ userName }: AgentProps) => {
  const isSpeaking = true;
  // Using state to manage call status for basic interactivity,
  // though currently logic is mostly placeholder.
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);

  const messages = [
    "Whats your name??",
    "My name is Abhay Jadhav, Nice to meet you!!",
  ];
  const lastMessage = messages[messages.length - 1];

  return (
    <>
      <div className="call-view">
        <div className="card-interview">
          <div className="avatar">
            <img
              src="/ai-avatar.png"
              alt="vapi"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>
        <div className="card-border">
          <div className="cord-content">
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

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500",
                "opacity-0",
                "animate-fade-in opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center items-center h-[100px]">
        {callStatus !== CallStatus.ACTIVE ? (
          <button
            className="relative btn-call"
            onClick={() => setCallStatus(CallStatus.ACTIVE)}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />
            <span className="">
              {callStatus === CallStatus.INACTIVE ||
              callStatus === CallStatus.FINISHED
                ? "Call"
                : "..."}
            </span>
          </button>
        ) : (
          <button
            className="btn-disconnect"
            onClick={() => setCallStatus(CallStatus.FINISHED)}
          >
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
