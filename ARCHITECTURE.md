# Stateless Backend API Architecture

## System Overview

This is a security-first, stateless architecture designed for high scalability and low latency. Authentication is handled using JSON Web Tokens (JWT) verified statelessly at the API boundary, with a silent refresh token rotation flow.

```
┌─────────────┐
│   Clients   │
└──────┬──────┘
       │ HTTPS
       ▼
┌──────────────────────────────┐
│  Backend API                 │
│  ├─ Express.js               │
│  ├─ Stateless JWT Validation │
│  ├─ Refresh Token Rotation   │
│  └─ In-Memory Rate Limiting  │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Data Layer                  │
│  └─ MongoDB (persistent)     │
└──────────────────────────────┘
```

### Trust Boundaries

1. **Client-to-Server:** HTTPS required. Server enforces authentication statelessly and handles user sessions via HttpOnly cookies.
2. **Server-to-Database:** MongoDB connection. Restricted to internal network or secure Atlas connections.

---

## Authentication Layer

**Purpose:** Identifies and authorizes requests without hitting a database.

**Responsibilities:**
- Verify JWT tokens from the `token` cookie (access token, 15-minute lifetime)
- Verify `decoded.type === "access"`
- Reject expired or malformed tokens immediately with `401 Unauthorized`
- Silently rotate tokens via `/api/auth/refresh` using the `refreshToken` cookie (7-day lifetime)
- Bind authenticated user IDs and roles to `req.userId` and `req.userRole`

**Security Assumptions:**
- Clients cannot access `HttpOnly` cookies (`token` and `refreshToken`).
- Tokens are secure against tampering due to server-side cryptographic signatures (HMAC-SHA256).

---

## Request Flow

1. **Client sends request**
   - Cookies: `token=<access_token>`

2. **Middleware processes**
   - Extract access token from `token` cookie.
   - Verify signature using `JWT_SECRET`.
   - Verify token is not expired and is of type `access`.
   - Attach user metadata (`req.userId`, `req.userRole`) to the request.

3. **Controller processes**
   - Trust the `req.userId` and `req.userRole` properties set by the middleware.
   - Execute business logic.
   - Interact with MongoDB if database persistence is needed.
   - Return response.

---

## Technology Stack

### Backend Layer
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose ODM
- **Authentication Token:** Stateless JWT (HMAC-SHA256)
- **Token Verification:** jsonwebtoken library

### Data Layer
- **Persistent Store:** MongoDB Atlas or self-managed MongoDB
- **Ephemeral Store:** None (completely stateless; rate limits and login attempts tracked in-memory)

---

## Operational Model

### Stateless Execution
- Backend API has zero local disk or persistent cache dependencies.
- Horizontally scaling (multiple server instances) is trivial.
- Authentication verification is extremely cheap and has zero database overhead.

### Token Expiration as the Kill Switch
- Since authentication is stateless, active tokens cannot be revoked instantly.
- To mitigate this, access tokens have a very short lifetime (15 minutes).
- Compromised tokens are only valid for a maximum of 15 minutes.
- Refresh tokens (7 days) are rotated on every refresh request (stateless Refresh Token Rotation).

### Rate Limiting Strategy
- **Login Attempts:** Tracked in-memory per server instance (5 attempts per 15 minutes).
- **API Endpoints:** Managed by Express rate limiter middleware.
