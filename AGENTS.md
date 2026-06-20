# AGENTS.md

## Project

React 19 + Vite frontend, Express backend. No package-manager workspace — `npm install` + `npm run dev` separately in each.

## Commands

```bash
# Server (port 8000 in .env, default 5000)
cd server && npm install && npm run dev       # nodemon
npm test                                       # Jest (--experimental-vm-modules)
npm run test:authcat                           # focused auth validation suite

# Client (port 5173)
cd client && npm install && npm run dev
npm run build
npm run lint                                   # ESLint flat config, ignores dist + NavBar.jsx
```

## Architecture

- **Auth:** `POST /api/auth/google` → Firebase Admin SDK verifies ID token → JWT cookie (`httpOnly`, `sameSite:strict`) + `deviceId` cookie. `isAuth` middleware validates JWT + binds session to device (Upstash Redis). `POST /api/auth/logout` clears both cookies + blacklists JWT jti.
- **Routes:** `routers/` (not `routes/`). Rate limiters: `authLimiter` (20/15min), `sessionLimiter` (30/min) via `express-rate-limit`.
- **Redis:** Two clients — `services/upstash.js` (Upstash REST, primary for sessions/cache/blacklist) and `config/redis.js` (ioredis, non-critical fallback). Server starts without Redis.
- **User model:** `name`, `email` (unique, required, lowercase), `picture`, `firebaseUID` (unique, sparse), `credits` (default 100), `role` (user|admin|superadmin), `isActive`, `lastLoginAt`, timestamps.
- **Audit logging:** `AuditLog` model via `logAuthEvent()` — events: LOGIN_SUCCESS/FAILURE, TOKEN_EXPIRED/INVALID, LOGOUT, etc.
- **Role middleware:** `requireRole()`, `requireAdmin()`, `requireSuperAdmin()` — reads `req.userRole` set by `isAuth`.

## Key paths

| File | Purpose |
|------|---------|
| `config/token.js` | `genToken()` + `verifyToken()` |
| `config/cookie.js` | `COOKIE_OPTIONS`, `TOKEN_COOKIE_OPTIONS` |
| `services/session.service.js` | create/get/delete session, blacklist jti, login rate limiting per email |
| `services/cache.service.js` | Redis-backed user/permissions/roles cache |
| `services/upstash.js` | Upstash Redis client singleton + `__setMockClient()` for tests |
| `middleware/isAuth.js` | Reads cookie JWT + device binding + blacklist check. Exports `optionalAuth` too |
| `middleware/rateLimiter.js` | `authLimiter` + `sessionLimiter` |
| `middleware/roleAuth.js` | `requireRole(...roles)` |

## Client quirks

- Tailwind CSS v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js`.
- `config.js` is single source of truth for `import.meta.env.VITE_*` vars. All frontend code imports from it.
- Axios pre-configured with `withCredentials: true`. 401 interceptor redirects to `/auth` (skipped for `/auth/google`).
- Redux: `userSlice` uses `createAsyncThunk` for `initializeAuth` (calls `GET /api/auth/me`).
- App hides NavBar during loading; shows SplashScreen until initialized.
- `ProtectedRoute` redirects to `/auth` with `state.from` for post-login redirect.
- Pages `/dashboard`, `/profile`, `/interview`, `/history` are all stubs ("Coming Soon").

## Server env vars

`SERVER/.env` needs: `PORT`, `MONGODB_URL`, `JWT_SECRET`, `CLIENT_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (with literal `\n` for newlines). Also `REDIS_URL` (ioredis, optional) and `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Upstash, optional).

## Docker

- Dockerfile: multi-stage Node 20-alpine, non-root user, `HEALTHCHECK` hitting `GET /api/user/current-user` (expects 401). `EXPOSE 8000`.
- Server source at `/app/server/`, built with `npm ci --omit=dev`.

## Known issues

- No edge-gateway directory exists yet — `ARCHITECTURE.md` describes an aspirational Cloudflare Worker layer.
- `SECURITY.md` and `README.md` are boilerplate, not accurate to current repo state.
- Server code has `routers/` (typo) directory — not `routes/` as README says.
