# AGENTS.md

## Project Structure
Monorepo: `client/` (React) and `server/` (Express)

## Commands

```bash
# Backend (port 5000)
cd server && npm run dev

# Frontend (port 5173)
cd client && npm run dev

# Frontend build/lint
cd client && npm run build
cd client && npm run lint
```

## Environment Setup Required

**server/.env:**
```
PORT=5000
MONGO_URI=<mongodb_connection_string>
JWT_SECRET=<jwt_key>
CLIENT_URL=http://localhost:5173
```

**client/.env:**
```
VITE_FIREBASE_API_KEY=<key>
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project>
VITE_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
VITE_FIREBASE_APP_ID=<app_id>
```

## Entry Points
- Server: `server/server.js` (Express app, connects to MongoDB)
- Client: `client/src/main.jsx` (Vite React app)

## Key Routes
- `/` - Home page
- `/auth` - Authentication page

## Current Testing
No tests defined (`server/package.json` has placeholder test script).

## Development Notes
- Client uses React 19, Vite, Tailwind CSS v4, Redux Toolkit
- Server uses Express, Mongoose (MongoDB), JWT with cookies
- Firebase Admin SDK loaded in server for token verification
- No codegen or build artifacts to manage