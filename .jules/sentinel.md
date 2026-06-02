## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2026-06-02 - Insecure Authentication Flow and Information Leakage

**Vulnerability:** The backend previously trusted user identity (name, email) sent directly from the client without verification, allowing for account impersonation. Additionally, the `getCurrentUser` controller leaked internal error details (stack traces/messages) to the client.

**Learning:** Client-side authentication states must always be verified server-side using a trusted authority (e.g., Firebase Admin SDK) before granting access or updating user records. Error handling should be opaque to the client to prevent reconnaissance.

**Prevention:** Implement server-side ID token verification for all authentication-related requests. Use a centralized error handling strategy that logs errors server-side while returning generic messages to the client. Ensure backend routes (like logout) use secure methods (POST) and align with frontend implementations.
