## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2025-05-20 - Global Error Handling and DoS Mitigation

**Vulnerability:** The application was vulnerable to information leakage through unhandled exceptions and potential Denial-of-Service (DoS) attacks from large JSON payloads.

**Learning:** Default Express configurations allow unlimited payload sizes and may leak stack traces for unhandled errors. A centralized error handler and explicit body limits are fundamental for production security.

**Prevention:** Implement `express.json({ limit: '10kb' })` and a global error handling middleware that returns generic 500 responses while logging specifics server-side.
