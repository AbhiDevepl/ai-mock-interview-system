## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2025-05-20 - Critical Authentication Bypass via Unverified Client Data

**Vulnerability:** The `googleAuth` controller trusted user identity data (name, email) sent directly from the client without verification. This allowed an attacker to impersonate any user by simply providing their email in the request body.

**Learning:** Client-side authentication is for the UI; server-side authentication must independently verify tokens from the identity provider. Relying on client-asserted identity is a common and critical security failure.

**Prevention:** Always verify third-party authentication tokens (like Firebase ID tokens) on the backend using official SDKs before granting access or creating sessions.
