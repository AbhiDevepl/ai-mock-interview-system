"use client";

import { useState, useCallback } from "react";
import {
  startInterview,
  evaluateAnswer,
  getSession,
  updateSessionStatus,
  InterviewSession,
  InterviewResponse,
  EvaluationResult,
  StartInterviewOptions,
} from "@/lib/services/interview.service";

interface UseInterviewReturn {
  session: InterviewSession | null;
  responses: InterviewResponse[];
  currentQuestionIndex: number;
  currentQuestion: string | null;
  isLoading: boolean;
  error: string | null;
  start: (options: StartInterviewOptions) => Promise<InterviewSession>;
  submitAnswer: (answer: string) => Promise<EvaluationResult>;
  nextQuestion: () => void;
  completeInterview: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  reset: () => void;
}

export function useInterview(): UseInterviewReturn {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = session?.questions?.[currentQuestionIndex] || null;

  const start = useCallback(async (options: StartInterviewOptions): Promise<InterviewSession> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newSession = await startInterview(options);
      setSession(newSession);
      setCurrentQuestionIndex(0);
      setResponses([]);
      return newSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start interview";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(async (answer: string): Promise<EvaluationResult> => {
    if (!session || !currentQuestion) {
      throw new Error("No active session or question");
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await evaluateAnswer({
        sessionId: session.id,
        questionIndex: currentQuestionIndex,
        question: currentQuestion,
        answer,
      });

      setResponses((prev) => [...prev, result]);
      return result.evaluation;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to evaluate answer";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, currentQuestion, currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    if (!session) return;
    
    setCurrentQuestionIndex((prev) => prev + 1);
    
    updateSessionStatus(session.id, "active", currentQuestionIndex + 1).catch(console.error);
  }, [session, currentQuestionIndex]);

  const completeInterview = useCallback(async () => {
    if (!session) return;

    try {
      await updateSessionStatus(session.id, "completed", currentQuestionIndex);
      setSession((prev) => prev ? { ...prev, status: "completed" } : null);
    } catch (err) {
      console.error("Failed to complete interview:", err);
      throw err;
    }
  }, [session, currentQuestionIndex]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSession(sessionId);
      setSession(data);
      setResponses(data.responses || []);
      setCurrentQuestionIndex(data.current_question_index || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load session";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSession(null);
    setResponses([]);
    setCurrentQuestionIndex(0);
    setError(null);
  }, []);

  return {
    session,
    responses,
    currentQuestionIndex,
    currentQuestion,
    isLoading,
    error,
    start,
    submitAnswer,
    nextQuestion,
    completeInterview,
    loadSession,
    reset,
  };
}
