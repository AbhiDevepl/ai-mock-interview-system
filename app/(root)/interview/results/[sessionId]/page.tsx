"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResultsPanel } from "@/components/interview/ResultsPanel";
import { getSession } from "@/lib/services/interview.service";
import { InterviewSession, InterviewResponse } from "@/lib/services/interview.service";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await getSession(sessionId);
        setSession(data);
        setResponses(data.responses || []);
        setAverageScore(data.averageScore || 0);
      } catch (error) {
        console.error("Failed to load results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [sessionId]);

  const handleRestart = () => {
    router.push("/interview/setup");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Results not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <ResultsPanel
        responses={responses}
        averageScore={averageScore}
        onRestart={handleRestart}
        onGoHome={handleGoHome}
      />
    </div>
  );
}
