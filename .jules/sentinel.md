## 2026-04-23 - [Authentication Hardening]
**Vulnerability:** Insecure cookie configuration and information leakage in error messages.
**Learning:** The application was using a non-existent `http: true` cookie option instead of `httpOnly: true`, making session tokens accessible to client-side scripts. Error messages were also exposing internal details via `${error.message}`.
**Prevention:** Always use `httpOnly: true` for sensitive cookies. Sanitize error messages returned to the client and use generic messages for production environments. Validate input types to prevent NoSQL injection.
