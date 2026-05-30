## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2026-05-30 - Insecure Logout and Information Disclosure

**Vulnerability:** The `/logout` route was implemented as a `GET` request, making it susceptible to CSRF-based logout attacks. Additionally, the `res.clearCookie` call for the session token lacked explicit security attributes (`httpOnly`, `secure`, `sameSite`), which could lead to inconsistent cookie clearing across different browser environments. Furthermore, the `getCurrentUser` controller leaked internal error details (`error.message`) to the client.

**Learning:** State-changing operations, even logout, should use `POST` to mitigate CSRF risks. Consistency between cookie setting and clearing attributes is crucial for reliable session management. Error messages must be generic to prevent reconnaissance.

**Prevention:** Use `POST` for logout routes. Explicitly define security attributes in `res.clearCookie` to match `res.cookie`. Always return generic error messages to the client while logging details on the server.
