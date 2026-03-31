"""
interview_agent.py — Session runner for a single interview.

This module is imported by main.py (FastAPI server).
`build_worker_job()` is the public entry point: it configures and returns a
WorkerJob for one interview session. main.py runs it in a dedicated thread.
"""
import asyncio
import json
import logging
import os

import jwt as pyjwt
from dotenv import load_dotenv
from supabase import Client, create_client

from videosdk.agents import Agent, AgentSession, JobContext, Pipeline, RoomOptions, WorkerJob
from videosdk.plugins.google import GeminiLiveConfig, GeminiRealtime

load_dotenv(dotenv_path=".env")

logger = logging.getLogger("agent.session")

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
VIDEOSDK_API_KEY = os.environ["VIDEOSDK_API_KEY"]
VIDEOSDK_SECRET_KEY = os.environ["VIDEOSDK_SECRET_KEY"]
GOOGLE_API_KEY = os.environ["GOOGLE_API_KEY"]

# ── Supabase (service role) ───────────────────────────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# ── Helpers ───────────────────────────────────────────────────────────────────
def generate_videosdk_token() -> str:
    """Generate a VideoSDK JWT using the API key + secret (same as Next.js)."""
    payload = {
        "apikey": VIDEOSDK_API_KEY,
        "permissions": ["allow_join", "allow_mod"],
    }
    return pyjwt.encode(payload, VIDEOSDK_SECRET_KEY, algorithm="HS256")


def update_session(
    session_id: str,
    status: str | None = None,
    report: dict | None = None,
    extra: dict | None = None,
) -> None:
    """
    Update any combination of fields on an interview session row.

    Args:
        session_id: UUID of the session.
        status:     Optional new value for the `status` column.
        report:     Optional JSON report to persist.
        extra:      Any additional columns to update (e.g. agent_status, started_at).
    """
    from datetime import datetime, timezone

    data: dict = {}
    if status is not None:
        data["status"] = status
    if report is not None:
        data["report"] = report
    if extra:
        # Resolve the special string "now()" to a real ISO timestamp
        for key, value in extra.items():
            data[key] = (
                datetime.now(timezone.utc).isoformat()
                if value == "now()"
                else value
            )

    if not data:
        return  # nothing to do

    supabase.table("interview_sessions").update(data).eq("id", session_id).execute()
    logger.info("[%s] updated → %s", session_id[:8], data)


def generate_report_with_gemini(
    session_id: str, role: str, level: str, questions: list[str]
) -> dict:
    """
    Ask Gemini to generate a structured interview report.
    In production you would pass the actual transcript here.
    For now we generate a professional evaluation based on the questions asked.
    """
    import google.generativeai as genai

    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""
You are a professional interview evaluator. A candidate just completed a voice interview
for a {level} {role} position.

Questions that were asked:
{json.dumps(questions, indent=2)}

Generate a fair and professional evaluation report. Return ONLY valid JSON with this structure:
{{
  "score": <integer 0-100>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "missed_questions": [],
  "summary": "<2-3 sentence overall assessment>"
}}
Do not include markdown, code fences, or any text outside the JSON object.
"""
    response = model.generate_content(prompt)
    raw = response.text.strip().lstrip("```json").rstrip("```").strip()
    return json.loads(raw)


# ── Agent ─────────────────────────────────────────────────────────────────────
class InterviewAgent(Agent):
    """Voice AI interviewer that asks pre-generated questions one by one."""

    def __init__(self, session_id: str, role: str, level: str, questions: list[str]):
        self._session_id = session_id
        self._role = role
        self._level = level
        self._questions = questions

        numbered = "\n".join(f"{i + 1}. {q}" for i, q in enumerate(questions))
        instructions = (
            f"You are a professional AI interviewer conducting a real-time voice interview "
            f"for a {level} {role} position.\n\n"
            f"You have exactly {len(questions)} questions to ask:\n{numbered}\n\n"
            "RULES:\n"
            "- Start with a brief warm greeting and ask if the candidate is ready.\n"
            "- Ask questions strictly in order — do not skip or repeat.\n"
            "- After each answer, give a short acknowledgment (1–2 sentences), then ask the next question.\n"
            "- When all questions are answered, say: "
            "'Thank you for your time. The interview is now complete. Please wait for your results.'\n"
            "- Keep all your responses concise — this is a voice conversation.\n"
            "- Do NOT answer questions yourself or go off-topic."
        )
        super().__init__(instructions=instructions)

    async def on_enter(self) -> None:
        """Called when agent joins the VideoSDK room."""
        await asyncio.sleep(1.0)  # wait for audio bridge to stabilise
        update_session(
            self._session_id,
            status="running",
            extra={"agent_status": "active", "started_at": "now()"},
        )
        await self.session.say(
            f"Hello! Welcome to your mock interview for the {self._role} position. "
            f"I'll be asking you {len(self._questions)} questions today. "
            "Please speak clearly and take your time. Are you ready to begin?"
        )

    async def on_exit(self) -> None:
        """Called when the agent is leaving the room."""
        logger.info("[%s] Agent on_exit triggered", self._session_id[:8])

        # Generate and save the report
        try:
            report = generate_report_with_gemini(
                self._session_id, self._role, self._level, self._questions
            )
            update_session(
                self._session_id,
                status="completed",
                report=report,
                extra={"agent_status": "finished", "completed_at": "now()"},
            )
        except Exception as exc:
            logger.exception("[%s] Report generation failed: %s", self._session_id[:8], exc)
            update_session(
                self._session_id,
                status="completed",
                report={
                    "score": 0,
                    "strengths": [],
                    "weaknesses": ["Report generation failed"],
                    "missed_questions": [],
                    "summary": "The interview was completed but the report could not be generated.",
                },
                extra={"agent_status": "error", "completed_at": "now()"},
            )


# ── Public entry point ────────────────────────────────────────────────────────
def build_worker_job(session_id: str, room_id: str, questions: list[str]) -> WorkerJob:
    """
    Build and return a WorkerJob for one interview session.
    Called by main.py — the job is then started in a dedicated OS thread.
    """
    auth_token = generate_videosdk_token()

    # Fetch role/level and mark agent as starting
    result = supabase.table("interview_sessions").select("role,level").eq("id", session_id).single().execute()
    role = result.data.get("role", "Software Engineer") if result.data else "Software Engineer"
    level = result.data.get("level", "Mid-Level") if result.data else "Mid-Level"

    update_session(session_id, extra={"agent_status": "starting"})

    async def entrypoint(context: JobContext) -> None:
        pipeline = Pipeline(
            llm=GeminiRealtime(
                model="gemini-2.0-flash-live-001",
                api_key=GOOGLE_API_KEY,
                config=GeminiLiveConfig(
                    voice="Puck",
                    response_modalities=["AUDIO"],
                ),
            )
        )
        agent = InterviewAgent(session_id, role, level, questions)
        session = AgentSession(agent=agent, pipeline=pipeline)
        await session.start(wait_for_participant=True, run_until_shutdown=True)

    def make_context() -> JobContext:
        return JobContext(
            room_options=RoomOptions(
                room_id=room_id,
                auth_token=auth_token,
                name="AI Interviewer",
                playground=True,
            )
        )

    return WorkerJob(entrypoint=entrypoint, jobctx=make_context)
