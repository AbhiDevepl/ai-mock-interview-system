# InterviewIQ.AI — AI Mock Interview System

A full-stack, AI-powered mock interview platform. Candidates upload a resume (or enter details manually); the backend extracts structured data and uses Groq to generate tailored interview questions and feedback.

## Tech Stack

| Layer | Technology (versions from `package.json`) |
|-------|-------------------------------------------|
| Frontend | React `19.2`, Vite `8.0`, React Router `7.14`, Tailwind CSS `4.2` (`@tailwindcss/vite`), Redux Toolkit `2.11` + react-redux `9.2`, Firebase Auth `12.12`, axios `1.15`, sonner `2.0`, motion `12.38` (framer-motion also present), lucide-react `1.8`, react-icons `5.6`, clsx `2.1`, tailwind-merge `3.5` |
| Backend | Node.js + Express `4.22`, Mongoose `7.8` (MongoDB driver bundled), jsonwebtoken `9.0`, cookie-parser `1.4.7`, cors `2.8.6`, helmet `8.2`, dotenv `16.6`, firebase-admin `13.10`, multer `2.2` (resume upload), pdfjs-dist `6.1` (PDF text extraction), uuid `10.0`, axios `1.18` |
| AI | Groq `llama-3.3-70b-versatile` via `https://api.groq.com/openai/v1/chat/completions` (key: `GROQ_API_KEY`) |
| Database | MongoDB (local or Atlas) via Mongoose |

> Notes: `react-hook-form`, `zod`, and `express-rate-limit` are present in `package.json` but are **not yet wired into application code**. The AI client lives in `server/services/openRouter.service.js` (name is legacy — it calls Groq, not OpenRouter).

## Prerequisites

- Node.js (LTS recommended; no `engines` constraint is set in either `package.json`).
- A MongoDB instance (local `mongod` or Atlas connection string).
- A Firebase project (for Google Sign-In) and a Groq API key.

This is **not** a monorepo with workspace tooling — `client/` and `server/` are two independent packages. Install and run them separately.

## Setup

### Backend (`/server`)
```bash
cd server
npm install
```
Create `server/.env`:
```env
PORT=8000
MONGODB_URL=mongodb://localhost:27017/ai-mock-interview-system
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@example.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Groq (REQUIRED — AI calls fail without it)
GROQ_API_KEY=your_groq_api_key
```
> Keep `FIREBASE_PRIVATE_KEY` as a literal `\n` (single backslash-n); the server converts `\\n` → newline at runtime. `PORT` must be `8000` to match the client's default `VITE_SERVER_URL` (`http://localhost:8000`).

```bash
npm run dev      # nodemon
```

### Frontend (`/client`)
```bash
cd client
npm install
```
Create `client/.env` (Firebase web config):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
# Optional — defaults to http://localhost:8000
# VITE_SERVER_URL=http://localhost:8000
```
```bash
npm run dev       # vite (port 5173)
```

## Scripts

| Package | Command | Purpose |
|---------|---------|---------|
| server | `npm run dev` | nodemon dev server |
| server | `npm start` | production start (`node server.js`) |
| server | `npm test` | Jest (`--experimental-vm-modules`, `--force-exit`) |
| server | `npm run test:authcat` | targets `__tests__/authcat-validation.test.js` (file not present yet) |
| client | `npm run dev` | vite dev server |
| client | `npm run build` | production build |
| client | `npm run lint` | ESLint (flat config) |
| client | `npm run preview` | preview built output |

> **Testing status:** Test tooling is wired but **no test specs exist in the repo yet**; `npm run test:authcat` points at a not-yet-created file. `npm test` currently runs with zero tests.

## API

Base URL: `http://localhost:8000` (path prefix `/api`). Auth: JWT in the `token` HttpOnly cookie (set by `/api/auth/google`).

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/google` | public | Verifies Firebase ID token, issues 7-day `access` JWT cookie, upserts user |
| POST | `/api/auth/logout` | optional | Clears `token` cookie |
| GET  | `/api/auth/me` | required | Current user |
| GET  | `/api/user/current-user` | required | Current user (used by client bootstrap) |
| POST | `/api/interview/resume` | required | Multipart `resume` PDF → analysis (same handler as below) |
| POST | `/api/resume/analyze` | required | Multipart `resume` PDF → text extraction + Groq → `{role, experience, skills, projects, resumeText}` |
| POST | `/api/interview/generate-question` | required | Body `{role, experience, mode, resumeText, skills, projects}` → 5 questions, deducts 50 credits |
| POST | `/api/interview/submit-answer` | required | Body `{interviewId, questionIndex, answer, timeTaken}` → score/feedback |
| GET  | `/api/interview/finish` | required | Finalize interview |

> `analyzeResume` is mounted at **both** `/api/interview/resume` and `/api/resume/analyze` (identical behavior).

## Core Features (verified in code)

- **Google Sign-In** — Firebase Admin verifies the ID token; backend issues a stateless JWT cookie.
- **Resume analysis** — PDF uploaded server-side, text extracted with `pdfjs-dist`, then sent to Groq to extract role / experience / skills / projects.
- **AI interview generation** — Groq produces 5 mode-specific questions; each generation costs 50 credits (users start with 100).
- **Interview session & answers** — candidates answer; backend scores and gives feedback per question.
- **Results & report** — final performance report rendered in-step (Step 3) of the interview flow.
- **Credits** — tracked on the `User` model, deducted per generated interview.

Not yet implemented (do not document as features): Dashboard, History, and Profile pages; refresh-token rotation; rate limiting.

## Folder Structure

```
ai-mock-interview-system/
├── client/                      # React frontend
│   └── src/
│       ├── components/          # AuthModel, NavBar, Footer, Step1SetUp, Step2Interview, Step3Report
│       ├── pages/               # Home, Auth, InterviewPage, InterviewReport (unused)
│       ├── redux/               # store.js, userSlice.js
│       ├── utils/               # firebase.js
│       ├── App.jsx
│       └── main.jsx             # Redux <Provider> + <BrowserRouter>
├── server/                      # Express backend
│   ├── config/                  # connectDB.js, token.js
│   ├── controllers/             # auth, user, interview
│   ├── middleware/              # isAuth.js (JWT), multer.js (upload)
│   ├── models/                  # user.model.js, interview.model.js
│   ├── routers/                 # auth, user, interview, resume
│   ├── services/                # openRouter.service.js (Groq client)
│   └── server.js
├── Dockerfile
└── README.md
```

## Known Constraints

- **Groq rate limits** (llama-3.3-70b-versatile free tier is commonly ~30 RPM / 1,000 RPD / 12,000 TPM — *verify against current Groq docs*, as limits vary by tier). Each interview triggers 1–2 Groq calls.
- The `token` cookie is a single 7-day `access` token; there is currently no refresh flow.
