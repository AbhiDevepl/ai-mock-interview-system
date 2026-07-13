# AGENTS.md

## Project
React 19 + Vite frontend (`client/`), Express backend (`server/`). Two independent packages with **no workspace** — install and run `npm` separately in each.

## Commands
```bash
# Server
cd server && npm install
npm run dev          # nodemon, port from PORT (default 5000)
npm test             # jest --experimental-vm-modules --force-exit (NO test specs exist yet)
npm run test:authcat # targets __tests__/authcat-validation.test.js (file not present)

# Client
cd client && npm install
npm run dev          # vite, port 5173
npm run build
npm run lint         # `eslint .` (flat config)
```

## Critical gotchas
- **Port mismatch:** server defaults to `PORT=5000` but the client (`config.js` → `VITE_SERVER_URL`) defaults to `http://localhost:8000`. Set `PORT=8000` in `server/.env` or the frontend can't reach the API.
- **`GROQ_API_KEY` is required** in `server/.env` — every AI call (resume analysis + question generation) fails without it.
- **No axios instance / interceptor.** Each request passes `{ withCredentials: true }` manually. There is **no** global 401→`/auth` redirect; if you see docs claiming one, they are stale.
- **`mode` enum bug (real 500):** `Interview.mode` allows only `HR|Technical|SystemDesign`, but the frontend `MODES` send `"Behavioral"` and `"System Design"`. `generateQuestion` persists `mode` → these choices throw a Mongoose validation error. Don't "fix" the frontend to match without also changing the enum.

## Architecture
- **Auth:** `POST /api/auth/google` → Firebase Admin verifies ID token → sets a **7-day `access` JWT** HttpOnly cookie (`sameSite: lax` in dev, `none` in prod). `isAuth` middleware validates it and binds `req.userId`/`req.userRole`. `refreshAuth` exists but is **not mounted** — there is no refresh flow despite older docs.
- **Routes dir is `routers/`, not `routes/`.**
- **Resume analysis is mounted twice:** `/api/interview/resume` and `/api/resume/analyze` (same `analyzeResume` handler).
- **AI:** `services/openRouter.service.js` (misnamed — uses **Groq**, not OpenRouter) calls `https://api.groq.com/openai/v1/chat/completions` with `llama-3.3-70b-versatile`.
- **PDF pipeline:** server-side `pdfjs-dist` text extraction → Groq chat completion. No native PDF input to Groq.
- **DB:** MongoDB via Mongoose. Server starts without Redis (none in codebase). `express-rate-limit` is installed but **unused** — no rate limiting is wired.

## Key paths
| File | Purpose |
|------|---------|
| `server/server.js` | Express entry, mounts routers, CORS with credentials |
| `server/config/token.js` | `genToken` (7d access); 15m/30d variants are dead code |
| `server/middleware/isAuth.js` | JWT cookie validation |
| `server/middleware/multer.js` | `upload.single("resume")` |
| `server/controllers/interview.controller.js` | `analyzeResume`, `generateQuestion`, `submitAnswer`, `finishInterview` |
| `server/services/openRouter.service.js` | Groq client (`askAi`) |
| `client/src/config.js` | Single source of truth for `VITE_*` env vars |
| `client/src/redux/store.js` + `userSlice.js` | Redux Toolkit (single `user` reducer, no async thunks) |
| `client/src/App.jsx` | Routes; bootstraps user via `GET /api/user/current-user` |
| `client/src/components/Step1SetUp.jsx` | Setup (role, experience, mode, resume upload) |
| `client/src/pages/InterviewPage.jsx` | Orchestrates Step1→Step2→Step3 (report is step 3, no separate route) |

## Frontend quirks
- **Routes:** `/` (Home), `/auth` (Auth), `/interview` (3-step flow), `*` (404). There is **no** `/interview-report`, `/dashboard`, `/profile`, or `/history` route — NavBar/Footer/Home only link to placeholders.
- Tailwind CSS v4 via `@tailwindcss/vite` — **no `tailwind.config.js`**.
- State: Redux Toolkit only; no Context/zustand. User bootstrapped in `App.jsx`, not an `initializeAuth` thunk.
- `AuthModel.jsx` is the auth modal (note the filename spelling: "Model", not "Modal"). `InterviewReport.jsx` exists but is **not routed** (report renders via `Step3Report` inside `InterviewPage`).
- `react-hook-form`/`zod`/`framer-motion` are deps but **not adopted** in app code (`motion` is used).

## Server env vars (`server/.env`)
`PORT` (set `8000`), `MONGODB_URL`, `JWT_SECRET`, `CLIENT_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (keep as literal `\n`; runtime converts `\\n`→newline), `GROQ_API_KEY`. No Redis vars.

## Docker
Multi-stage `node:20-alpine`, non-root `appuser`, `HEALTHCHECK` hits `GET /api/user/current-user` (expects 401), `EXPOSE 8000`, source at `/app/server/`, built with `npm ci --omit=dev`.

## Known gaps (unimplemented — don't assume present)
- No refresh-token rotation (dead `refreshAuth`), no rate limiting, no `AuditLog`/role-auth middleware.
- Client pages `/dashboard`, `/profile`, `/history` are stubs/absent.
- No tests despite `npm test` / `test:authcat` scripts.
- `README.md` / `ARCHITECTURE.md` were recently rewritten from audited source; trust them over any older copy.
