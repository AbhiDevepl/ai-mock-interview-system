## 2025-05-14 - Authentication Flow Hardening

**Vulnerability:**
- Insecure cookie configuration: `httpOnly` was missing, allowing client-side script access to authentication tokens (XSS risk).
- Verbose error messages: Backend was leaking internal error details and stack traces via API responses.
- Missing input validation: Email field was not validated on the backend, potentially allowing NoSQL injection or malformed data.

**Learning:**
- The initial authentication flow was relying on client-side data without sufficient backend validation and secure session management.
- Verbose catch blocks in middleware and controllers were exposing internal application state.

**Prevention:**
- Always set `httpOnly: true` for sensitive cookies.
- Use generic error messages for client-facing API responses while logging details internally.
- Validate all user-provided input on the backend, even if it's expected to come from a trusted source like Firebase.
