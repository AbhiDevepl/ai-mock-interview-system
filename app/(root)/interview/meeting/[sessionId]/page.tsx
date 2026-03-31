"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import { getSession, InterviewSession } from "@/lib/services/interview.service";
import Agent from "@/components/Agent";

type SessionStatus = InterviewSession["status"];

export default function MeetingPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState("Candidate");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Load session + user name + VideoSDK token ──────────────────────────────
  const loadSession = useCallback(async () => {
    try {
      const [sessionData, tokenRes] = await Promise.all([
        getSession(sessionId),
        (() => {
          // Will be fetched after we know the roomId
          return null;
        })(),
      ]);

      setSession(sessionData);

      // Fetch VideoSDK token for this room
      const tokenResponse = await fetch("/api/videosdk/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: sessionData.room_id }),
      });

      if (!tokenResponse.ok) throw new Error("Failed to get VideoSDK token");
      const { token: vToken } = await tokenResponse.json();
      setToken(vToken);

      // Fetch current user name
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name as string);
      }
    } catch (err) {
      console.error("Failed to load session:", err);
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // ── Subscribe to Supabase Realtime for status changes ─────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "interview_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as InterviewSession;
          setSession(updated);

          if (updated.status === "completed") {
            router.push(`/interview/results/${sessionId}`);
          }
          if (updated.status === "failed") {
            setError("The interview session encountered an error. Please try again.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, router]);

  // ── Status label helper ───────────────────────────────────────────────────
  const statusLabel: Record<SessionStatus, string> = {
    pending: "Waiting for AI Interviewer to connect…",
    running: "Interview in progress",
    completed: "Interview complete — redirecting…",
    failed: "Session failed",
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Setting up your interview…
        </div>
      </div>
    );
  }

  if (error || !session || !token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive font-medium">
          {error ?? "Session not found"}
        </p>
        <button
          className="btn-call"
          onClick={() => router.push("/interview/setup")}
        >
          Back to Setup
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-10 px-4 gap-6">
      {/* Status banner */}
      <div className="w-full max-w-2xl">
        <div
          className={`rounded-xl px-4 py-2 text-sm font-medium text-center transition-colors ${
            session.status === "running"
              ? "bg-green-500/20 text-green-400"
              : session.status === "failed"
              ? "bg-red-500/20 text-red-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {statusLabel[session.status]}
        </div>
      </div>

      {/* Interview details */}
      <div className="text-center text-muted-foreground text-sm">
        <span className="font-medium text-foreground">{session.role}</span>
        {" · "}
        {session.level}
        {" · "}
        {session.tech_stack.join(", ")}
      </div>

      {/* VideoSDK meeting room */}
      <div className="w-full max-w-2xl">
        <Agent
          userName={userName}
          roomId={session.room_id}
          token={token}
        />
      </div>
    </div>
  );
}
