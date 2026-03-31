"use client";

import { cn } from "@/lib/utils";

interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
}

interface FeedbackPanelProps {
  evaluation: EvaluationResult | null;
  isLoading?: boolean;
}

export function FeedbackPanel({ evaluation, isLoading }: FeedbackPanelProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-20 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Submit your answer to see feedback
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold">Score</h3>
        <div className="flex items-center gap-4">
          <span className="text-4xl font-bold text-primary">
            {evaluation.score}
          </span>
          <span className="text-muted-foreground">/ 100</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                evaluation.score >= 70
                  ? "bg-green-500"
                  : evaluation.score >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
              )}
              style={{ width: `${evaluation.score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Feedback</h3>
        <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-green-600">Strengths</h3>
          <ul className="text-sm space-y-1">
            {evaluation.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500">+</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-amber-600">Areas to Improve</h3>
          <ul className="text-sm space-y-1">
            {evaluation.areasForImprovement.map((area, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500">-</span>
                {area}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
