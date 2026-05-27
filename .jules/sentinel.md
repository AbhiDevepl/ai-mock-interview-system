## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2025-05-16 - Authentication Bypass via Client-Side Identity Spoofing

**Vulnerability:** The backend trusted user identity data (name, email) sent directly from the frontend after social login, allowing any user to impersonate others by simply sending a target's email address in the request body.

**Learning:** Client-side authentication success does not equal server-side authorization. Relying on unverified claims from the client is a critical security flaw.

**Prevention:** Always perform server-side verification of third-party authentication tokens (e.g., Firebase ID tokens) using the provider's official SDK or public keys before establishing a session.
