import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/supabase/server";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate the user ──────────────────────────────
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Parse and validate the body ───────────────────────
    const body = await request.json();
    const { room_id, role, level, tech_stack, questions } = body as {
      room_id: string;
      role: string;
      level: string;
      tech_stack: string[];
      questions: string[];
    };

    if (!room_id || !role || !level || !tech_stack?.length || !questions?.length) {
      return NextResponse.json(
        { error: "room_id, role, level, tech_stack, and questions are required" },
        { status: 400 }
      );
    }

    // ── 3. Create session in Supabase (service role bypasses RLS) ──
    const adminSupabase = createAdminClient();
    const { data: session, error: dbError } = await adminSupabase
      .from("interview_sessions")
      .insert({
        user_id: user.id,
        room_id,
        role,
        level,
        tech_stack,
        questions,
        status: "pending",
      })
      .select()
      .single();

    if (dbError || !session) {
      console.error("[Interview Start] DB insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to create session", message: dbError?.message },
        { status: 500 }
      );
    }

    // ── 4. Trigger the Python agent (fire-and-forget) ────────
    const agentUrl = `${env.PYTHON_AGENT_URL}/start`;

    try {
      const agentRes = await fetch(agentUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.id }),
        signal: AbortSignal.timeout(10_000), // 10 second timeout
      });

      if (!agentRes.ok) {
        const err = await agentRes.text();
        throw new Error(`Agent returned ${agentRes.status}: ${err}`);
      }
    } catch (agentError) {
      console.error("[Interview Start] Failed to trigger agent:", agentError);
      // Mark session as failed so the UI doesn't hang
      await adminSupabase
        .from("interview_sessions")
        .update({ status: "failed" })
        .eq("id", session.id);

      return NextResponse.json(
        {
          error: "Agent service unavailable. Is the Python agent running?",
          session_id: session.id,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ session_id: session.id });
  } catch (error) {
    console.error("[Interview Start] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
