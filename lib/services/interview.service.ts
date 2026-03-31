export interface InterviewSession {
  id: string;
  user_id: string;
  room_id?: string;
  status: "pending" | "active" | "completed";
  role: string;
  level: string;
  techstack: string[];
  current_question_index: number;
  questions: string[];
  created_at: string;
}

export interface InterviewResponse {
  id: string;
  session_id: string;
  question_index: number;
  question: string;
  answer: string;
  score?: number;
  feedback?: string;
  created_at: string;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
}

export interface StartInterviewOptions {
  userId: string;
  role: string;
  level: string;
  techstack: string[];
  questions: string[];
  roomId?: string;
}

export interface EvaluateAnswerOptions {
  sessionId: string;
  questionIndex: number;
  question: string;
  answer: string;
}

export async function startInterview(options: StartInterviewOptions): Promise<InterviewSession> {
  const response = await fetch("/api/interview/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start interview");
  }

  return response.json();
}

export async function evaluateAnswer(
  options: EvaluateAnswerOptions
): Promise<InterviewResponse & { evaluation: EvaluationResult }> {
  const response = await fetch("/api/interview/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to evaluate answer");
  }

  return response.json();
}

export async function getSession(
  sessionId: string
): Promise<InterviewSession & { responses: InterviewResponse[]; averageScore: number }> {
  const response = await fetch(`/api/interview/session/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get session");
  }

  return response.json();
}

export async function updateSessionStatus(
  sessionId: string,
  status: "pending" | "active" | "completed",
  currentQuestionIndex?: number
): Promise<InterviewSession> {
  const response = await fetch(`/api/interview/session/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, currentQuestionIndex }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update session");
  }

  return response.json();
}
