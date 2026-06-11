# Edge Gateway and Backend API Architecture

## System Overview

This is a security-first, distributed architecture separating client request handling from backend business logic:

```
┌─────────────┐
│   Clients   │
└──────┬──────┘
       │ HTTPS
       ▼
┌──────────────────────────────┐
│  Cloudflare Edge (Global)    │
│  ├─ JWT Validation           │
│  ├─ Token Blacklist Check    │
│  ├─ Rate Limiting (per IP)   │
│  ├─ Rate Limiting (per User) │
│  └─ Request Routing          │
└──────┬───────────────────────┘
       │ Authenticated + Limited
       │ Request + x-auth-* headers
       ▼
┌──────────────────────────────┐
│  Backend API (Regional)      │
│  ├─ Express.js               │
│  ├─ Business Logic           │
│  ├─ MongoDB Integration      │
│  └─ Internal Trust Boundary  │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Data Layer                  │
│  ├─ MongoDB (persistent)     │
│  ├─ Redis/Upstash (ephemeral)│
│  │  ├─ Token Blacklist       │
│  │  └─ Rate Limit State      │
│  └─ Session Store            │
└──────────────────────────────┘
```

### Trust Boundaries

1. **Edge-to-Client:** HTTPS required. Edge layer enforces authentication and rate limiting.
2. **Edge-to-Backend:** Private network or VPN. Backend implicitly trusts `x-auth-user-id` and `x-auth-authenticated` headers set by Edge layer.
3. **Backend-to-Database:** Internal connection. No external exposure.

---

## Edge Gateway Role (Cloudflare Worker)

**Location:** `server/edge-gateway`

**Purpose:** Acts as a global, stateless security proxy. All client requests flow through it.

**Responsibilities:**
- Extract and validate JWT tokens from `Authorization: Bearer <token>` headers
- Query Redis blacklist to reject revoked tokens
- Enforce rate limits per IP address and per user ID
- Forward validated requests to backend API with authentication metadata
- Inject security headers into all responses
- Route requests based on path patterns

**NOT Responsible For:**
- Business logic of any kind
- User data transformation or validation beyond JWT claims
- Direct database access
- Session management (state stored in Redis only, ephemeral)
- Long-running computations or background jobs

**Failure Behavior (Explicit):**
- Missing JWT on protected route → 401 Unauthorized
- Invalid or expired JWT → 401 Unauthorized
- Token blacklisted in Redis → 401 Unauthorized
- Redis unavailable for blacklist check → 503 Service Unavailable (fail-closed)
- Rate limit exceeded (IP) → 429 Too Many Requests
- Rate limit exceeded (User) → 429 Too Many Requests
- Rate limiter backend unavailable → 429 Too Many Requests (fail-closed)
- Upstream backend unavailable → 502 Bad Gateway
- Forbidden route (not /auth/*, /api/*, /health) → 403 Forbidden

---

## Backend API Role (Express.js)

**Location:** `server/`

**Purpose:** Executes application business logic in a trusted environment.

**Responsibilities:**
- Accept only validated, rate-limited requests from Edge layer
- Process business logic (interview setup, feedback generation, etc.)
- Interact with MongoDB for persistent state
- Return structured JSON responses

**Security Assumptions:**
- All incoming requests have been authenticated by Edge layer
- Headers `x-auth-user-id` and `x-auth-authenticated` are set by Edge layer only
- No unauthenticated requests reach the backend
- Backend never directly receives client JWT tokens (Edge strips Authorization header)

**NOT Responsible For:**
- Rate limiting (delegated to Edge)
- Token validation (delegated to Edge)
- Security header injection (delegated to Edge)
- Authentication orchestration (delegated to Edge)

---

## Request Flow

1. **Client sends request with JWT**
   ```
   POST /api/interview/start
   Authorization: Bearer <JWT_TOKEN>
   ```

2. **Edge Gateway processes**
   - Extract token from Authorization header
   - Verify JWT signature using JWT_SECRET
   - Check token expiration (exp claim)
   - Query Redis for blacklist (key: `auth:blacklist:<jti>`)
   - Check rate limits: per-IP and per-user
   - Strip Authorization header (security)
   - Add x-auth-user-id and x-auth-authenticated headers
   - Log decision (ALLOW/DENY/RATE_LIMIT)

3. **Backend API receives**
   ```
   POST /api/interview/start
   x-auth-user-id: user_123
   x-auth-authenticated: true
   (no Authorization header)
   ```

4. **Backend processes**
   - Trust the x-auth-* headers
   - Execute business logic
   - Interact with MongoDB
   - Return response

5. **Edge Gateway injects security headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Referrer-Policy: no-referrer
   - Strict-Transport-Security: max-age=31536000; includeSubDomains

6. **Client receives response**
   - All security headers present
   - JWT not exposed to response
   - Rate limit metadata not exposed

---

## Technology Stack

### Edge Layer
- **Runtime:** Cloudflare Workers
- **Language:** TypeScript
- **JWT Verification:** Web Crypto API (HMAC-SHA256)
- **Rate Limiting:** Upstash Ratelimit SDK
- **Redis Client:** Upstash Redis REST API

### Backend Layer
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose ODM
- **Authentication Token:** JWT (HMAC-SHA256)
- **Session Storage:** Redis (via Upstash)

### Data Layer
- **Persistent Store:** MongoDB Atlas or self-managed MongoDB
- **Ephemeral Store:** Upstash Redis (managed Redis REST API)

---

## Operational Model

### Stateless Execution
- Edge Worker has zero disk state
- No in-memory state across requests
- All decisions based on JWT payload + Redis state
- Horizontal scaling (multiple Edge Worker instances) is trivial

### Fail-Closed Security Model
- Missing dependencies (Redis) → deny request
- Ambiguous state (blacklist query timeout) → deny request
- Configuration errors (missing JWT_SECRET) → reject at startup
- No "best effort" fallbacks that weaken security

### Rate Limiting Strategy
- **Per-IP:** 100 requests per 15 minutes (sliding window)
- **Per-User:** 200 requests per 1 minute (sliding window)
- Limits are enforced in Redis atomically
- Both checks must pass; exceeding either triggers 429

### Token Revocation
- Tokens are valid until `exp` claim is reached
- Revocation is via Redis blacklist key: `auth:blacklist:<jti>`
- Setting key with TTL matches token expiration
- No polling or callback needed; revocation is checked per-request

---

## Deployment Model

### Edge Gateway Deployment
- Deployed via `wrangler publish` to Cloudflare global network
- Automatically distributed to 250+ locations worldwide
- Sub-millisecond latency to clients

### Backend API Deployment
- Deployed separately (typically to a regional cloud provider like AWS, GCP, Azure)
- Not exposed to public internet; only accessible from Edge Workers
- Can scale independently based on backend load

### DNS and Routing
- Client DNS points to Cloudflare (via CNAME or nameserver delegation)
- Cloudflare routes to Edge Worker
- Edge Worker routes to private backend (via Cloudflare Tunnel or private network)

---

## Observability

### Edge Gateway Logging
- Structured JSON logs: `{ path, status, latency, outcome, ip }`
- No sensitive data (JWT tokens, secrets) logged
- Outcome values: ALLOW, DENY, RATE_LIMIT
- Suitable for Cloudflare Logpush to cloud storage

### Backend Logging
- Request receipt with x-auth-user-id
- Business operation outcomes
- Database transaction logs
- Error stack traces (non-production sensitive data stripped)

---

## Security Boundaries

### What the Edge Gateway CAN See
- Client IP address (via CF-Connecting-IP header)
- Request path and HTTP method
- Authorization header content (JWT)
- Rate limit state (from Redis)

### What the Edge Gateway CANNOT See
- Backend secrets or database credentials
- User data beyond JWT claims
- Business logic
- Internal API contracts

### What the Backend TRUSTS
- x-auth-user-id header (set by Edge only)
- x-auth-authenticated header (set by Edge only)
- All other headers from client (treated as untrusted)

---
