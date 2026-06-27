## 2026-05-19 - Hardening Optional Authentication Middleware
**Vulnerability:** The `optionalAuth` middleware was not enforcing device-to-session binding, allowing potentially stolen JWTs to be used in 'optional' contexts where `req.userId` might still be used for logic.
**Learning:** Session state must be validated consistently across both mandatory and optional authentication paths to prevent inconsistent security states and potential identity spoofing in "soft-auth" scenarios.
**Prevention:** Enforce all session validity checks (device binding, blacklisting) in any middleware that populates user context from a token, and ensure both `token` and `deviceId` cookies are cleared on failure.
