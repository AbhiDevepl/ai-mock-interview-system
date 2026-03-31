"""
FastAPI HTTP server for the AI Interview Agent.
Receives session_id → spawns a WorkerJob in a background thread per session.

Start with: uvicorn main:app --host 0.0.0.0 --port 8000
"""
import logging
import os
import threading
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import Client, create_client

load_dotenv(dotenv_path=".env")

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("agent.server")

# ── Supabase client (service role — bypasses RLS) ─────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# ── App ───────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Interview Agent server starting…")
    yield
    logger.info("AI Interview Agent server shutting down.")


app = FastAPI(title="AI Interview Agent", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ── Request / Response models ─────────────────────────────────────────────────
class StartRequest(BaseModel):
    session_id: str


# ── Helpers ───────────────────────────────────────────────────────────────────
def fetch_session(session_id: str) -> dict:
    result = (
        supabase.table("interview_sessions")
        .select("*")
        .eq("id", session_id)
        .single()
        .execute()
    )
    if not result.data:
        raise ValueError(f"Session '{session_id}' not found in Supabase")
    return result.data


def mark_session(session_id: str, status: str, report: dict | None = None) -> None:
    payload: dict = {"status": status}
    if report is not None:
        payload["report"] = report
    supabase.table("interview_sessions").update(payload).eq("id", session_id).execute()
    logger.info("Session %s → %s", session_id, status)


# ── Background runner ─────────────────────────────────────────────────────────
def run_agent_thread(session_id: str, room_id: str, questions: list[str]) -> None:
    """
    Executed in a dedicated OS thread so WorkerJob can manage its own
    asyncio event loop without conflicting with FastAPI's loop.
    """
    import asyncio

    from backend.agent.interview_agent import build_worker_job

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        job = build_worker_job(session_id, room_id, questions)
        job.start()          # blocking — runs until session ends
    except Exception as exc:
        logger.exception("Agent crashed for session %s: %s", session_id, exc)
        mark_session(session_id, "failed")
    finally:
        loop.close()


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "AI Interview Agent"}


@app.post("/start")
async def start_interview(body: StartRequest, background_tasks: BackgroundTasks):
    session_id = body.session_id

    # 1. Fetch session data
    try:
        session = fetch_session(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    # 2. Guard: only start from "pending"
    if session["status"] != "pending":
        raise HTTPException(
            status_code=409,
            detail=f"Session is already '{session['status']}' — cannot start again.",
        )

    room_id: str = session["room_id"]
    questions: list[str] = session["questions"]

    if not isinstance(questions, list):
        raise HTTPException(status_code=422, detail="Session 'questions' must be a list")

    # 3. Spawn agent in a background thread
    thread = threading.Thread(
        target=run_agent_thread,
        args=(session_id, room_id, questions),
        daemon=True,
        name=f"agent-{session_id[:8]}",
    )
    thread.start()
    logger.info("Spawned agent thread for session %s (room %s)", session_id, room_id)

    return {"status": "started", "session_id": session_id}
