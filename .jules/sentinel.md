## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2025-05-16 - Identity Verification Bypass in Google Authentication

**Vulnerability:** The backend trusted user-provided data (name, email) from the request body during Google authentication without verifying the identity with an authoritative source (Firebase). This allowed an attacker to impersonate any user by simply providing their email address in the request.

**Learning:** Client-provided data should never be trusted for authentication purposes. Relying on the frontend to provide user identity without server-side verification is a critical security flaw.

**Prevention:** Always verify third-party authentication tokens (like Firebase ID tokens) on the backend using the appropriate SDK or verification logic. Use the verified information from the token as the single source of truth for user identity.
