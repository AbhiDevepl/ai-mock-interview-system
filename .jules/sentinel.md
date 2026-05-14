## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2025-05-16 - Authentication Bypass via Unverified Client Data

**Vulnerability:** The `googleAuth` controller trusted the `email` and `name` fields directly from the request body without verification. This allowed an attacker to impersonate any user by simply providing their email address in the API call.

**Learning:** Never trust identity data provided by the client. Client-side authentication (like Firebase on the frontend) must be accompanied by server-side verification of a cryptographically signed token (ID Token) to establish identity securely.

**Prevention:** Always require an ID Token or similar proof of authentication from the client and verify it on the backend using the appropriate SDK (e.g., Firebase Admin SDK) before granting access or creating a session.
