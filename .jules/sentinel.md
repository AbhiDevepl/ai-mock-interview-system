## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2026-05-22 - Authentication Logout Inconsistency and CSRF Risk

**Vulnerability:** The logout endpoint was defined as a `GET` request in the backend, while the frontend attempted to call it via `POST`. This inconsistency could lead to functional failures and leaves the application more susceptible to CSRF-based logout attacks.

**Learning:** Security-sensitive operations like logging out should use state-changing methods (`POST`) to align with REST principles and browser security models. Discrepancies between frontend and backend methods for auth actions are critical failure points.

**Prevention:** Always use `POST` for logout and ensure the frontend and backend are aligned on the request method. Secure cookie clearing should mirror the attributes used during creation.
