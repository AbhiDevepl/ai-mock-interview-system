# Sentinel Security Journal

## 2026-03-29 - JWT Algorithm Confusion Protection
**Vulnerability:** Insecure default verification of JWT signatures, where `jwt.verify` by default accepts any signing algorithm provided in the token header (such as `none` or asymmetric algorithms), leading to algorithm switching or key confusion attacks (e.g., using a public key symmetrically).
**Learning:** Although `jsonwebtoken` prevents `none` by default in newer versions, explicitly restricting verification to a whitelist of symmetric algorithms (such as `["HS256"]`) is essential to prevent signature verification bypass when symmetric and asymmetric keys are mixed or potentially compromised.
**Prevention:** Always specify the `algorithms` array parameter in JWT validation middleware options to explicitly whitelist acceptable algorithms.

## 2026-03-30 - Deactivated User Metered AI Abuse
**Vulnerability:** Lack of deactivation checks in metered/expensive AI endpoints (`generateQuestion`, `analyzeResume`) and `/api/user/current-user`. Although login/authentication endpoints checked `isActive` status, deactivated users with active valid tokens could still abuse metered AI APIs and maintain client-side session context.
**Learning:** Authentication checks must occur at every resource access point when dealing with high-cost or state-sensitive resources. Relying solely on login-time verification or JWT existence creates a significant time-of-check to time-of-use (TOCTOU) gap during user deactivation.
**Prevention:** Always verify user deactivation/active status against the database for high-cost metered API calls and bootstrap endpoints. Clean up uploaded user resources (e.g., uploaded files) if the request is rejected due to account deactivation.
