## 2026-05-15 - Authentication Bypass in Google Auth

**Vulnerability:** The `googleAuth` controller in `server/controllers/auth.controller.js` was trusting user-provided email and name from `req.body` without any server-side verification. This allowed an attacker to impersonate any user by simply providing their email address in the request.

**Learning:** Client-side authentication (like Firebase on the frontend) must always be complemented by server-side verification of identity tokens. Trusting the frontend for user identity is a critical security flaw.

**Prevention:** Always require and verify a cryptographically signed identity token (e.g., Firebase ID token) on the backend using the appropriate SDK (e.g., `firebase-admin`). Extract user information directly from the verified token payload rather than the request body.
## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2026-05-15 - Helmet COOP and Google Auth Compatibility

**Vulnerability:** Default security headers from `helmet` can break essential third-party integrations like Google Identity Services due to restrictive `Cross-Origin-Opener-Policy` (COOP) settings.

**Learning:** `helmet` v8+ enables `COOP: same-origin` by default, which prevents the window communication required for Google Auth popups.

**Prevention:** When using Google Auth or similar popup-based authentication, configure `helmet` with `crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }` to maintain security without breaking functionality.
