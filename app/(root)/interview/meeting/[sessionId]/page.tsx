"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInterview } from "@/lib/hooks/useInterview";
import { useVideoSDK } from "@/lib/hooks/useVideoSDK";
import { QuestionPanel } from "@/components/interview/QuestionPanel";
import { FeedbackPanel } from "@/components/interview/FeedbackPanel";
import { MeetingRoom } from "@/components/interview/MeetingRoom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EvaluationResult } from "@/lib/services/interview.service";

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const { token, roomId, fetchToken, isLoading: sdkLoading } = useVideoSDK();
  const [showMeeting, setShowMeeting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const {
    session,
    currentQuestion,
    currentQuestionIndex,
    isLoading: interviewLoading,
    submitAnswer,
    nextQuestion,
    completeInterview,
    loadSession,
  } = useInterview();

  useEffect(() => {
    loadSession(sessionId);
  }, [sessionId, loadSession]);

  useEffect(() => {
    if (session?.room_id && !token) {
      fetchToken(session.room_id);
    }
  }, [session?.room_id, token, fetchToken]);

  const handleSubmitAnswer = async (answer: string) => {
    try {
      const result = await submitAnswer(answer);
      setEvaluation(result);
      setShowFeedback(true);
    } catch {
      toast.error("Failed to submit answer");
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setEvaluation(null);
    nextQuestion();
  };

  const handleFinish = async () => {
    try {
      await completeInterview();
      router.push(`/interview/results/${sessionId}`);
    } catch {
      toast.error("Failed to complete interview");
    }
  };

  const handleLeaveMeeting = () => {
    setShowMeeting(false);
  };

  if (interviewLoading || sdkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {session.role} Interview - {session.level}
          </h1>
          {!showMeeting && (
            <Button onClick={() => setShowMeeting(true)} variant="outline">
              Open Video Call
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {showMeeting && token && roomId ? (
              <MeetingRoom
                token={token}
                roomId={roomId}
                userName="Candidate"
                onLeave={handleLeaveMeeting}
              />
            ) : (
              <QuestionPanel
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                totalQuestions={session.questions.length}
                onSubmit={handleSubmitAnswer}
                isLoading={interviewLoading}
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="border rounded-lg bg-card">
              <FeedbackPanel evaluation={evaluation} isLoading={showFeedback && interviewLoading} />
            </div>

            {showFeedback && (
              <div className="flex gap-4">
                {currentQuestionIndex < session.questions.length - 1 ? (
                  <Button onClick={handleNextQuestion} className="flex-1">
                    Next Question
                  </Button>
                ) : (
                  <Button onClick={handleFinish} className="flex-1">
                    Finish Interview
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
