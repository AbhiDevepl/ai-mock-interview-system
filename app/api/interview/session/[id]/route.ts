import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/supabase/server";

// ── GET /api/interview/session/[id] ───────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Uses RLS — user can only fetch their own session
    const { data: session, error } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("[Session GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/interview/session/[id] ────────────────────────────────────────
// Called by the Python agent (via service role key) to update status + report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // The Python agent calls this endpoint directly.
    // We use the admin client because the agent doesn't have user cookies —
    // it authenticates via the SUPABASE_SERVICE_ROLE_KEY set server-side.
    const adminSupabase = createAdminClient();

    const body = await request.json();
    const { status, report } = body as {
      status?: "pending" | "running" | "completed" | "failed";
      report?: Record<string, unknown>;
    };

    const updatePayload: Record<string, unknown> = {};
    if (status) updatePayload.status = status;
    if (report) updatePayload.report = report;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await adminSupabase
      .from("interview_sessions")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      console.error("[Session PATCH] Error:", error);
      return NextResponse.json(
        { error: "Failed to update session", message: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Session PATCH] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
