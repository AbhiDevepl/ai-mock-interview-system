"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InterviewSetup } from "@/components/interview/InterviewSetup";
import { startInterview } from "@/lib/services/interview.service";
import { useVideoSDK } from "@/lib/hooks/useVideoSDK";

export default function InterviewSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { createNewRoom } = useVideoSDK();

  const handleStartInterview = async (data: {
    role: string;
    level: string;
    techstack: string[];
  }) => {
    setIsLoading(true);
    try {
      const { roomId } = await createNewRoom();
      
      const questions = generateQuestions(data.role, data.level, data.techstack);
      
      const session = await startInterview({
        userId: "current-user",
        role: data.role,
        level: data.level,
        techstack: data.techstack,
        questions,
        roomId,
      });

      router.push(`/interview/meeting/${session.id}`);
    } catch (error) {
      console.error("Failed to start interview:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestions = (role: string, level: string, techstack: string[]) => {
    const questions: string[] = [];
    
    questions.push(`Tell me about yourself and your experience as a ${role}.`);
    
    questions.push(`What is your experience with ${techstack[0] || "the required technologies"}?`);
    
    questions.push(level === "Junior" 
      ? `Describe a project you've worked on that demonstrates your skills.`
      : `Describe a challenging technical problem you solved in a production environment.`
    );
    
    questions.push(`What are your strengths and weaknesses as a ${role}?`);
    
    questions.push(`Where do you see yourself in 3-5 years?`);
    
    return questions;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <InterviewSetup onStartInterview={handleStartInterview} isLoading={isLoading} />
    </div>
  );
}
