# AGENTS.md

## Project

React 19 + Vite frontend (`client/`), Express backend (`server/`). No workspace — run `npm install` + `npm run dev` separately in each.

## Commands

```bash
# Server (port 8000 in .env, default 5000)
cd server && npm install && npm run dev       # nodemon
npm test                                       # Jest (--experimental-vm-modules)

# Client (port 5173)
cd client && npm install && npm run dev
npm run build
npm run lint                                   # ESLint flat config, ignores dist + NavBar.jsx
```

## Architecture

- **Auth:** `POST /api/auth/google` → Firebase Admin SDK verifies ID token → sets JWT cookie (`httpOnly`, `sameSite:strict`). `isAuth` middleware validates JWT. `POST /api/auth/logout` clears cookie.
- **Routes:** `routers/` (not `routes/`). No rate limiters currently.
- **Database:** MongoDB via Mongoose. Server starts without Redis (no Redis in current codebase).
- **User model:** `name`, `email` (unique, required, lowercase), `picture`, `firebaseUID` (unique, sparse), `credits` (default 100), `role` (user|admin|superadmin), `isActive`, `lastLoginAt`, timestamps.
- **AI:** `services/openRouter.service.js` calls Groq (llama-3.3-70b-versatile) via `GROQ_API_KEY`.
- **Interviews:** Multi-step flow (Setup → Interview → Report) via `components/Step*.jsx` and `pages/InterviewPage.jsx`.

## Key paths

| File | Purpose |
|------|---------|
| `server/server.js` | Express entry, mounts routers |
| `server/config/connectDB.js` | Mongoose connection |
| `server/config/token.js` | `genToken()` + `verifyToken()` |
| `server/middleware/isAuth.js` | JWT cookie validation middleware |
| `server/middleware/multer.js` | File upload (resume) |
| `server/controllers/auth.controller.js` | Google auth, logout, me |
| `server/controllers/user.controller.js` | User profile, credits |
| `server/controllers/interview.controller.js` | Interview CRUD, AI feedback |
| `server/services/openRouter.service.js` | Groq AI integration |
| `client/src/config.js` | Single source of truth for `import.meta.env.VITE_*` |
| `client/src/redux/userSlice.js` | Redux user state (no async thunks yet) |
| `client/src/App.jsx` | Routes, bootstraps user via `GET /api/user/current-user` |
| `client/src/components/Step1SetUp.jsx` | Interview config (role, level, type, tech stack) |
| `client/src/components/Step2Interview.jsx` | Interview session (voice/video) |
| `client/src/components/Step3Report.jsx` | Results & AI feedback |
| `client/src/pages/InterviewPage.jsx` | Orchestrates 3-step interview flow |

## Client quirks

- Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js`.
- `config.js` is single source of truth for all `VITE_*` env vars.
- Axios default `withCredentials: true`. 401 interceptor redirects to `/auth`.
- Redux: `userSlice` uses plain reducers; `initializeAuth` thunk not yet implemented.
- App shows `NavBar` + `Footer` on all routes; no splash screen or protected routes yet.
- Pages: `/` (Home), `/auth`, `/interview` (3-step flow), `/interview-report`. `/dashboard`, `/profile`, `/history` don't exist yet.

## Server env vars

`server/.env` needs: `PORT`, `MONGODB_URL`, `JWT_SECRET`, `CLIENT_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (literal `\n`), `GROQ_API_KEY`. No Redis vars needed.

## Docker

- `Dockerfile`: multi-stage Node 20-alpine, non-root user, `HEALTHCHECK` hits `GET /api/user/current-user` (expects 401). `EXPOSE 8000`.
- Server source at `/app/server/`, built with `npm ci --omit=dev`.

## Known gaps (not yet implemented)

- No `services/session.service.js`, `services/cache.service.js`, `services/upstash.js`
- No `middleware/rateLimiter.js`, `middleware/roleAuth.js`
- No `AuditLog` model or `logAuthEvent()`
- No `config/cookie.js` (cookie options inline in auth controller)
- No Redis clients (`config/redis.js`, `services/upstash.js`)
- No `requireRole()`, `requireAdmin()`, `requireSuperAdmin()`
- Client: no `ProtectedRoute`, no `SplashScreen`, no `initializeAuth` thunk
- Client pages `/dashboard`, `/profile`, `/history` are stubs (don't exist)
- `README.md` and `SECURITY.md` are boilerplate, not accurate