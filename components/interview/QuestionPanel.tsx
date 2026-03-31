"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QuestionPanelProps {
  question: string | null;
  questionIndex: number;
  totalQuestions: number;
  onSubmit: (answer: string) => Promise<void>;
  isLoading?: boolean;
}

export function QuestionPanel({
  question,
  questionIndex,
  totalQuestions,
  onSubmit,
  isLoading,
}: QuestionPanelProps) {
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error("Please enter an answer");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(answer);
      setAnswer("");
    } catch {
      toast.error("Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        toast.info("Audio recorded. Transcription coming soon.");
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch {
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info("Recording stopped");
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  if (!question) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-6 bg-muted/50 rounded-xl">
        <h3 className="text-lg font-medium mb-2">Question:</h3>
        <p className="text-lg">{question}</p>
      </div>

      <div className="space-y-4">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full min-h-[150px] p-4 rounded-lg border bg-background resize-none"
          disabled={isSubmitting || isLoading}
        />

        <div className="flex gap-3">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSubmitting || isLoading}
          >
            {isRecording ? "Stop Recording" : "Start Voice Recording"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting || isLoading}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
