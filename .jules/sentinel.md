## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2026-05-24 - Identity Impersonation via Client-Trusted Fields

**Vulnerability:** The `googleAuth` endpoint trusted identity information (email, name) sent directly in the request body from the client. An attacker could impersonate any user by simply providing their email address in the POST request to `/api/auth/google`.

**Learning:** Never trust identity claims provided by the frontend without server-side verification against an authoritative source.

**Prevention:** Use a cryptographically signed token (like a Firebase ID Token) and verify it server-side using the appropriate SDK or public keys before establishing a session.
