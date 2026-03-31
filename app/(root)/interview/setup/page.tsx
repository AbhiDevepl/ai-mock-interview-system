"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InterviewSetup } from "@/components/interview/InterviewSetup";
import { generateQuestions, startInterview } from "@/lib/services/interview.service";
import { createRoom } from "@/lib/services/videosdk.service";

export default function InterviewSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartInterview = async (data: {
    role: string;
    level: string;
    techstack: string[];
  }) => {
    setIsLoading(true);
    try {
      // 1. Create VideoSDK room
      toast.loading("Creating interview room…", { id: "setup" });
      const { roomId } = await createRoom();

      // 2. Generate questions with Gemini
      toast.loading("Generating questions with AI…", { id: "setup" });
      const questions = await generateQuestions({
        role: data.role,
        level: data.level,
        techstack: data.techstack,
      });

      // 3. Create session in Supabase + trigger Python agent
      toast.loading("Starting interview session…", { id: "setup" });
      const { session_id } = await startInterview({
        room_id: roomId,
        role: data.role,
        level: data.level,
        tech_stack: data.techstack,
        questions,
      });

      toast.success("Interview ready! Joining room…", { id: "setup" });
      router.push(`/interview/meeting/${session_id}`);
    } catch (error) {
      console.error("Failed to start interview:", error);
      const message =
        error instanceof Error ? error.message : "Failed to start interview";
      toast.error(message, { id: "setup" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <InterviewSetup onStartInterview={handleStartInterview} isLoading={isLoading} />
    </div>
  );
}
