## 2026-05-15 - Authentication Bypass in Google Auth

**Vulnerability:** The `googleAuth` controller in `server/controllers/auth.controller.js` was trusting user-provided email and name from `req.body` without any server-side verification. This allowed an attacker to impersonate any user by simply providing their email address in the request.

**Learning:** Client-side authentication (like Firebase on the frontend) must always be complemented by server-side verification of identity tokens. Trusting the frontend for user identity is a critical security flaw.

**Prevention:** Always require and verify a cryptographically signed identity token (e.g., Firebase ID token) on the backend using the appropriate SDK (e.g., `firebase-admin`). Extract user information directly from the verified token payload rather than the request body.
## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2026-06-10 - API Contract Mismatch and Information Disclosure

**Vulnerability:** The logout route was configured as a `GET` request in the backend while the frontend attempted a `POST` request, leading to potential CSRF risks if downgraded and functional inconsistency. Additionally, the `getCurrentUser` endpoint leaked raw database error messages to the client.

**Learning:** Authentication state changes (like logout) should always use non-idempotent methods like `POST` to prevent pre-fetching or simple link-based CSRF. Inconsistent API contracts between frontend and backend can hide security misconfigurations.

**Prevention:** Ensure all state-changing routes use `POST`, `PUT`, or `DELETE`. Audit all error handlers to ensure they log internally but respond with generic messages to prevent reconnaissance via information leakage.
