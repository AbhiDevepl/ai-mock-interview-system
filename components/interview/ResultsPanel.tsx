"use client";

import { Button } from "@/components/ui/button";
import { InterviewResponse } from "@/lib/services/interview.service";

interface ResultsPanelProps {
  responses: InterviewResponse[];
  averageScore: number;
  onRestart: () => void;
  onGoHome: () => void;
}

export function ResultsPanel({
  responses,
  averageScore,
  onRestart,
  onGoHome,
}: ResultsPanelProps) {
  const getScoreColor = (score: number | undefined) => {
    if (!score) return "text-muted-foreground";
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B+";
    if (score >= 60) return "B";
    if (score >= 50) return "C";
    return "D";
  };

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Interview Complete!</h1>
        <div className="text-6xl font-bold text-primary">{getGrade(averageScore)}</div>
        <p className="text-2xl">
          Average Score: <span className={getScoreColor(averageScore)}>{averageScore.toFixed(1)}</span>/100
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Question Breakdown</h2>
        <div className="space-y-4">
          {responses.map((response, index) => (
            <div
              key={response.id}
              className="p-4 border rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">Q{index + 1}: {response.question}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your Answer: {response.answer}
                  </p>
                </div>
                <div className="text-2xl font-bold">
                  <span className={getScoreColor(response.score)}>
                    {response.score?.toFixed(0) || "N/A"}
                  </span>
                </div>
              </div>
              {response.feedback && (
                <div className="text-sm bg-muted/50 p-3 rounded">
                  <p className="font-medium">Feedback:</p>
                  <p className="text-muted-foreground">{response.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={onRestart} className="flex-1" size="lg">
          Try Again
        </Button>
        <Button onClick={onGoHome} variant="outline" className="flex-1" size="lg">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
