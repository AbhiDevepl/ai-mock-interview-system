import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/supabase/server";
import type { InterviewSession, InterviewReport } from "@/lib/services/interview.service";

async function getSessionServer(sessionId: string): Promise<InterviewSession | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !data) return null;
  return data as InterviewSession;
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSessionServer(sessionId);

  if (!session) {
    redirect("/interview/setup");
  }

  if (session.status !== "completed") {
    redirect(`/interview/meeting/${sessionId}`);
  }

  const report = session.report as InterviewReport | null;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Interview Results</h1>
          <p className="text-muted-foreground">
            {session.role} · {session.level} ·{" "}
            {session.tech_stack.join(", ")}
          </p>
        </div>

        {report ? (
          <>
            {/* Score */}
            <div className="rounded-2xl border bg-card p-6 flex flex-col items-center gap-2">
              <span className="text-sm text-muted-foreground uppercase tracking-widest">
                Overall Score
              </span>
              <span
                className={`text-6xl font-extrabold ${
                  report.score >= 75
                    ? "text-green-400"
                    : report.score >= 50
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {report.score}
                <span className="text-2xl text-muted-foreground">/100</span>
              </span>
              {report.summary && (
                <p className="text-center text-muted-foreground text-sm max-w-md mt-2">
                  {report.summary}
                </p>
              )}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                title="✅ Strengths"
                items={report.strengths}
                variant="success"
              />
              <ResultCard
                title="⚠️ Areas to Improve"
                items={report.weaknesses}
                variant="warning"
              />
            </div>

            {/* Missed questions */}
            {report.missed_questions?.length > 0 && (
              <ResultCard
                title="❓ Missed Questions"
                items={report.missed_questions}
                variant="neutral"
              />
            )}
          </>
        ) : (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            No detailed report was generated for this session.
          </div>
        )}

        {/* Questions asked */}
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-lg">Questions Asked</h2>
          <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
            {session.questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/interview/setup"
            className="btn-call text-center"
          >
            Start New Interview
          </Link>
          <Link
            href="/"
            className="btn-disconnect text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function ResultCard({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "success" | "warning" | "neutral";
}) {
  const colors = {
    success: "bg-green-500/10 border-green-500/20",
    warning: "bg-yellow-500/10 border-yellow-500/20",
    neutral: "bg-muted/50 border-border",
  };

  return (
    <div className={`rounded-2xl border p-5 space-y-2 ${colors[variant]}`}>
      <h3 className="font-semibold text-sm">{title}</h3>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground flex gap-2">
              <span>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">None</p>
      )}
    </div>
  );
}
