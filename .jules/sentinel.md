## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2026-04-23 - Authentication Bypass via Client-Asserted Identity

**Vulnerability:** The Google Authentication endpoint (`/api/auth/google`) trusted unverified user profile data (name, email) sent directly from the client. This allowed an attacker to impersonate any user by merely knowing their email address.

**Learning:** Trusting the frontend for identity assertions is a critical security failure. Client-side authentication only provides a token; the backend must independently verify that token with the identity provider (Firebase) before establishing a session.

**Prevention:** Use server-side SDKs (like `firebase-admin`) to cryptographically verify ID tokens. Use the verified unique identifier (UID) as the primary key for user lookups rather than mutable or easily spoofed fields like email.
