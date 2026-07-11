## 2026-05-20 - [Broken Authentication Middleware Extraction]
**Vulnerability:** The `isAuth` middleware failed to correctly extract the JWT from the `token` cookie because it attempted to destructure a string as an object (`let { token } = req.cookies.token;`). This resulted in `token` being `undefined` even when a valid cookie was present.
**Learning:** In Express with `cookie-parser`, `req.cookies.cookieName` returns the raw string value of the cookie. Destructuring should only be used if the cookie itself is a JSON-encoded object (which is rare and not the case here).
**Prevention:** Always verify cookie extraction logic with integration tests. Standardize on `req.cookies?.cookieName` for safe access. Ensure authentication middleware fails with 401 status for ALL errors to prevent information leakage and accurately report the failure reason to clients.

## 2026-05-20 - [Un-rate-limited Authorization Checks]
**Vulnerability:** Routes performing authorization checks (`/api/auth/me`, `/api/user/current-user`, `/api/auth/logout`) were not rate-limited, leading to potential brute-force or DoS risks and triggering CodeQL security alerts.
**Learning:** Any endpoint that validates user identity or session state must be protected by rate-limiting middleware to prevent automated abuse of the authentication subsystem.
**Prevention:** Consistently apply `sessionLimiter` or equivalent middleware to all routes requiring authentication or session management.
