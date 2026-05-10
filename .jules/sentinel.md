## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.
