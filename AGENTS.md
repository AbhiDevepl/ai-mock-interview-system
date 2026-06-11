# AGENTS.md

## Project Overview

AI Mock Interview System — React (Vite) frontend + Express backend monorepo.

Auth: Firebase (Google OAuth) → server-side ID token verification via Firebase Admin SDK → JWT cookie session + MongoDB user storage.

---

## Repo Structure

```
ai-mock-interview-system/
├── client/                 # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/     # AuthModel.jsx, NavBar.jsx
│   │   ├── pages/          # Auth.jsx, Home.jsx
│   │   ├── redux/          # store.js, userSlice.js
│   │   └── utils/          # firebase.js
│   ├── .env                # VITE_* env vars (see below)
│   └── vite.config.js
├── server/                 # Express + Mongoose backend
│   ├── config/             # connectDB.js, firebaseAdmin.js, token.js
│   ├── controllers/        # auth.controller.js, user.controller.js
│   ├── middleware/         # isAuth.js
│   ├── models/             # user.model.js
│   ├── routers/            # auth.route.js, user.route.js
│   ├── .env                # server secrets (see below)
│   └── server.js
├── Dockerfile              # Single-stage Node 18 image (server only)
├── AGENTS.md
└── README.md
```

---

## Commands

```bash
# Backend — port 8000 (or PORT env)
cd server && npm install && npm run dev

# Frontend — port 5173
cd client && npm install && npm run dev

# Frontend production build
cd client && npm run build

# Frontend lint
cd client && npm run lint
```

---

## Environment Variables

### `server/.env`

```env
PORT=8000
MONGODB_URL=<mongodb_connection_string>
JWT_SECRET=<jwt_secret_key>
CLIENT_URL=http://localhost:5173

# Firebase Admin SDK (from Firebase Console → Service Account → Generate new key)
FIREBASE_PROJECT_ID=<project_id>
FIREBASE_CLIENT_EMAIL=<client_email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### `client/.env`

```env
VITE_SERVER_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=<api_key>
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project_id>
VITE_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
VITE_FIREBASE_APP_ID=<app_id>
```

---

## Auth Flow

```
Client                         Server
  │                               │
  ├─ signInWithPopup(Google) ─►  │
  ├─ getIdToken() ─────────────► │
  │                               ├─ admin.auth().verifyIdToken(idToken)
  │                               ├─ findOrCreate User by email
  │                               ├─ genToken(user._id) → JWT
  │                               ├─ res.cookie("token", jwt, httpOnly)
  ◄─ return user JSON ───────────┤
  ├─ dispatch(setUserData(user)) │
```

- Frontend sends Firebase ID token in `POST /api/auth/google` body as `{ idToken, name, photo }`.
- Backend verifies token with Firebase Admin SDK, extracts `email` from decoded token.
- JWT is set as an `httpOnly` cookie (`secure: true` in production).
- Subsequent protected requests use `isAuth` middleware that reads the cookie and attaches `req.userId`.

---

## Key Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/google` | None | Google OAuth — verifies Firebase ID token, creates/finds user, sets JWT cookie |
| `GET` | `/api/auth/logout` | None | Clears JWT cookie |
| `GET` | `/api/user/current-user` | `isAuth` | Returns current user from MongoDB |

---

## Data Model — `User`

```js
{
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  credits:   { type: Number, default: 100 },
  createdAt: Date,  // timestamps: true
  updatedAt: Date,
}
```

---

## Security Notes

- `isAuth` middleware validates JWT from cookie; sets `req.userId`.
- `googleAuth` controller **only** trusts `email` extracted from the server-side-verified Firebase ID token — never from `req.body` directly.
- Cookie flags: `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`, `sameSite: "strict"`.
- Internal errors are never leaked to the client — generic 500 messages only.
- See `.jules/sentinel.md` for documented vulnerability history and mitigations.

---

## Known Issues / TODOs

- `server/routers/auth.route.js` exposes `GET /logout` — should be `POST` to prevent CSRF via link navigation.
- `user.model.js` does not store `firebaseUID` or `picture`/`photo` — schema needs extension for multi-provider support.
- `client/src/App.jsx` duplicates `serverUrl` logic already defined in `client/src/config.js` — consolidate.
- No tests defined (`npm test` exits with error on both client and server).
- Redux `userSlice` has redundant `user` field alongside `userData`.

---

## Docker

```bash
# Build server image
docker build -t ai-mock-interview-server .

# Run (pass env vars at runtime)
docker run -p 8000:8000 \
  -e PORT=8000 \
  -e MONGODB_URL=<url> \
  -e JWT_SECRET=<secret> \
  -e CLIENT_URL=<client_url> \
  -e FIREBASE_PROJECT_ID=<id> \
  -e FIREBASE_CLIENT_EMAIL=<email> \
  -e FIREBASE_PRIVATE_KEY="<key>" \
  ai-mock-interview-server
```

The Dockerfile targets the `server/` directory only. Frontend is built separately and served via a CDN/static host (Vercel, Netlify, etc.).
