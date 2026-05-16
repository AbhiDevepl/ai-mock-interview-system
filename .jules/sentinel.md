## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2026-05-16 - Logout Route Mismatch and CSRF Mitigation

**Vulnerability:** Inconsistent route methods for sensitive operations like logout can lead to CSRF vulnerabilities (if using GET) and broken functionality if the frontend and backend disagree on the method.

**Learning:** Always verify existing frontend implementations before changing backend route methods. In this case, the frontend was already correctly using `POST` for logout, but the backend was inconsistently defined as `GET`. Aligning them to `POST` secured the endpoint without requiring frontend changes.

**Prevention:** Standardize sensitive state-changing operations to use `POST` (or other non-idempotent methods) and verify alignment between client and server.
