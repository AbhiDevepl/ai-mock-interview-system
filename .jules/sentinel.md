# Sentinel's Security Journal

## 2025-05-15 - [Security Hardening of Authentication and API]
**Vulnerability:**
- Misspelled `http: true` instead of `httpOnly: true` in authentication cookies, making tokens accessible to client-side scripts (XSS risk).
- Lack of input validation in `googleAuth` could lead to NoSQL injection or unexpected behavior if attackers pass objects instead of strings.
- Logout route was a `GET` request, susceptible to CSRF or browser pre-fetching.
- Middleware leaked internal `error.message` on authentication failure.
- No payload size limit on incoming JSON requests (DoS risk).

**Learning:** Initial implementation focused on functionality over security, leading to several common security oversights in cookie configuration, input handling, and error reporting.

**Prevention:**
- Always use `httpOnly: true` and environment-aware `secure` flags for session cookies.
- Validate all user-supplied input types before processing or database interaction.
- Use `POST` for any state-changing operations, including logout.
- Return generic error messages for authentication failures.
- Implement global middleware for request size limits and security headers (e.g., helmet).
