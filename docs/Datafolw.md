# Architecture Refactor: Session-Driven AI Mock Interview System

## Overview

Replace the current fragmented approach (tokens passed around, questions hardcoded in frontend, no real state management) with a clean session-driven architecture where **Supabase is the single source of truth** and **`session_id` is the only cross-service reference**.

## Current Problems

- Questions are generated with hardcoded logic in the frontend (`generateQuestions()`) — no Gemini
- The Python agent reads `ROOM_ID` from env vars at startup — it has no idea which interview to run
- `userId: "current-user"` is hardcoded — no real auth link
- `interview.service.ts` calls API routes that don't exist yet (`/api/interview/start`, etc.)
- The Python agent is a long-running `WorkerJob` process with no HTTP interface
- No realtime status tracking

## Architecture After Refactor

```
User clicks "Start" 
  → Next.js: Create VideoSDK room (/api/videosdk/create-room) ✅ exists
  → Next.js: Call Gemini to generate 5 questions (/api/gemini/questions) [NEW]
  → Next.js: Write session to Supabase (interview_sessions) [NEW table]
  → Next.js: POST /api/interview/start → calls Python agent
  → Python FastAPI: receives session_id, reads from Supabase, joins room, runs interview
  → Python: updates session status + report in Supabase
  → Frontend: polls/subscribes Supabase for status changes
```

## User Review Required

> [!IMPORTANT]
> The Python agent changes from a persistent `WorkerJob` process to a **FastAPI HTTP server**.
> You will need to run it separately (`uvicorn main:app`). The `run.sh` will be updated accordingly.

> [!WARNING]
> A new Supabase table (`interview_sessions`) is required. You'll need to run the SQL migration in your Supabase dashboard SQL editor.

> [!CAUTION]
> The `SUPABASE_SERVICE_ROLE_KEY` must be set in both `.env.local` (for Next.js) AND `agent/.env` (for the Python agent) so both can write to Supabase without RLS restrictions.

## Proposed Changes

---

### Database

#### [NEW] `supabase/migrations/interview_sessions.sql`
- Creates `interview_sessions` table with all required fields
- Sets up RLS: users can only read their own sessions; service role can do anything

---

### Next.js API Routes

#### [NEW] `app/api/gemini/questions/route.ts`
- `POST` — accepts `{ role, level, techstack }`, calls Gemini to generate exactly 5 interview questions, returns `string[]`

#### [MODIFY] `app/api/interview/start/route.ts`
- Was a stub; now: creates session in Supabase, triggers Python agent via HTTP, returns `{ session_id }`

#### [NEW] `app/api/interview/session/[id]/route.ts`
- `GET` — return session by id
- `PATCH` — update status/report (used by Python agent)

---

### Services & Hooks

#### [MODIFY] `lib/services/interview.service.ts`
- Update `InterviewSession` type to match new Supabase schema
- Add `createSession()`, `getSession()`, `watchSession()` functions

#### [MODIFY] `lib/hooks/useInterview.ts`
- Simplify: only needs to trigger start, then watch session status via polling or Supabase realtime

---

### Frontend Pages

#### [MODIFY] `app/(root)/interview/setup/page.tsx`
- Replace hardcoded `generateQuestions()` with `POST /api/gemini/questions`
- Use real `userId` from `getCurrentUser()`
- After session created, `POST /api/interview/start` then redirect to `/interview/meeting/[sessionId]`

#### [NEW] `app/(root)/interview/meeting/[sessionId]/page.tsx`
- Shows VideoSDK room (existing `Agent.tsx` or `MeetingRoom.tsx`)
- Polls session status; shows "Connecting AI Agent..." while `pending`, interview UI while `running`, redirects to results when `completed`

#### [NEW] `app/(root)/interview/results/[sessionId]/page.tsx`
- Reads session `report` from Supabase, shows score, strengths, weaknesses, missed questions

---

### Python Agent — Full Rewrite as FastAPI

#### [MODIFY] `agent/interview_agent.py`
- Becomes a FastAPI app with `POST /start` endpoint
- Accepts `{ session_id }`, fetches session from Supabase, joins VideoSDK room, runs interview with questions, saves report

#### [MODIFY] `agent/requirements.txt`
- Add: `fastapi`, `uvicorn`, `supabase`

#### [MODIFY] `agent/run.sh`
- Change to: `uvicorn interview_agent:app --host 0.0.0.0 --port 8000`

---

### Environment

#### [MODIFY] `.env.local`
- Add: `PYTHON_AGENT_URL=http://localhost:8000` (URL for Next.js to call the agent)
- Add: `GOOGLE_GENERATIVE_AI_API_KEY` (already exists)

#### [MODIFY] `agent/.env`
- Add: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

#### [MODIFY] `lib/env.ts`
- Add `PYTHON_AGENT_URL` to the schema

## Open Questions

> [!IMPORTANT]
> **Python version**: The FastAPI server needs Python 3.12+. Confirm your WSL Python version is correct before running.

## Verification Plan

### Manual Verification
1. Run `agent/run.sh` → FastAPI server starts on port 8000
2. Run `npm run dev` → Next.js starts on port 3000
3. Sign in, go to `/interview/setup`, fill form, click Start
4. Verify: Supabase `interview_sessions` row created with status `pending`
5. Verify: Python agent logs show it received the session_id and joined the room
6. Verify: Status changes to `running` then `completed` in Supabase
7. Verify: `/interview/results/[id]` shows the final report
