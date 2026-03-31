// ── Types ─────────────────────────────────────────────────────────────────────

export interface InterviewSession {
  id: string;
  user_id: string;
  room_id: string;
  role: string;
  level: string;
  tech_stack: string[];
  questions: string[];
  status: "pending" | "running" | "completed" | "failed";
  report: InterviewReport | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewReport {
  score: number; // 0–100
  strengths: string[];
  weaknesses: string[];
  missed_questions: string[];
  summary: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiCall<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || err.message || `Request failed: ${response.status}`);
  }
  return response.json();
}

// ── Generate questions via Gemini ─────────────────────────────────────────────

export async function generateQuestions(params: {
  role: string;
  level: string;
  techstack: string[];
}): Promise<string[]> {
  const data = await apiCall<{ questions: string[] }>("/api/gemini/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return data.questions;
}

// ── Create session + trigger agent ───────────────────────────────────────────

export async function startInterview(params: {
  room_id: string;
  role: string;
  level: string;
  tech_stack: string[];
  questions: string[];
}): Promise<{ session_id: string }> {
  return apiCall("/api/interview/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

// ── Fetch a single session ────────────────────────────────────────────────────

export async function getSession(sessionId: string): Promise<InterviewSession> {
  return apiCall(`/api/interview/session/${sessionId}`);
}
