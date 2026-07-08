# Stateless JWT Authentication Flow with Refresh Token Rotation (RTR)

This document describes the stateless JWT authentication architecture implemented in this application.

## Overview

The authentication system is completely stateless. It does not require any database checks or Redis lookups for standard API requests, ensuring extremely low latency and high scalability.

```
┌─────────────┐            Firebase Login             ┌──────────────────────┐
│   Client    ├──────────────────────────────────────>│ Firebase Auth Service│
└──────┬──────┘                                       └──────────┬───────────┘
       │                                                         │
       │ Send Firebase ID Token                                  │ Firebase ID Token
       ▼                                                         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ Backend Server (Express.js)                                                │
│                                                                            │
│ 1. Verify Firebase ID Token via Firebase Admin SDK                         │
│ 2. Upsert user in MongoDB (keyed by firebaseUID)                           │
│ 3. Generate two stateless JWTs:                                            │
│    - Access Token: short-lived (15 minutes), cookie: `token`               │
│    - Refresh Token: long-lived (7 days), cookie: `refreshToken`            │
└──────┬─────────────────────────────────────────────────────────────────────┘
       │
       │ Return HttpOnly Cookies (token & refreshToken)
       ▼
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ├─────────────────────────────────────────┐
       │ (Access Token valid)                    │ (Access Token expired / 401)
       ▼                                         ▼
┌─────────────────────────────┐           ┌──────────────────────────────────┐
│ Request /api/user/me        │           │ Axios Interceptor Intercepts 401 │
│                             │           │                                  │
│ - verified statelessly by   │           │ 1. POST /api/auth/refresh        │
│   `isAuth` middleware       │           │ 2. Server verifies refreshToken  │
│ - no database lookup required│           │ 3. Server issues new access +    │
│ - extremely fast & cheap    │           │    refresh cookies (rotation)    │
└─────────────────────────────┘           │ 4. Retry original request        │
                                          └──────────────────────────────────┘
```

## Token Specifications

- **Access Token:**
  - **Lifetime:** 15 minutes
  - **Storage:** `HttpOnly`, `SameSite: Strict`, `Secure` cookie named `token`
  - **Payload:** `{ userId, role, type: "access" }`
  - **Purpose:** Authorizes API requests statelessly via `isAuth` middleware.

- **Refresh Token:**
  - **Lifetime:** 7 days
  - **Storage:** `HttpOnly`, `SameSite: Strict`, `Secure` cookie named `refreshToken`
  - **Payload:** `{ userId, role, type: "refresh" }`
  - **Purpose:** Automatically renews and rotates the access token without prompting the user.

## Silent Refresh & Interceptor

To prevent the user from being logged out every 15 minutes, the client uses an Axios interceptor:
1. When an API call fails with a `401 Unauthorized` response, the interceptor checks if it has already retried.
2. If not, it marks the request as retrying (`_retry = true`).
3. It makes a silent background `POST /api/auth/refresh` request (which sends the `refreshToken` cookie).
4. If the refresh succeeds, the server returns new rotated `token` and `refreshToken` cookies, and the interceptor automatically retries the original request.
5. If the refresh fails (e.g. refresh token expired or user deactivated), the interceptor clears the user state and redirects to `/auth`.

## Rate Limiting

- **Login Attempts Rate Limiter:** Implemented in-memory per server instance (15-minute window, maximum 5 attempts).
- **API Route Rate Limiter:** Standard express-rate-limit middleware configured per endpoint.
