# Sentinel Security Journal

## 2026-03-29 - JWT Algorithm Confusion Protection
**Vulnerability:** Insecure default verification of JWT signatures, where `jwt.verify` by default accepts any signing algorithm provided in the token header (such as `none` or asymmetric algorithms), leading to algorithm switching or key confusion attacks (e.g., using a public key symmetrically).
**Learning:** Although `jsonwebtoken` prevents `none` by default in newer versions, explicitly restricting verification to a whitelist of symmetric algorithms (such as `["HS256"]`) is essential to prevent signature verification bypass when symmetric and asymmetric keys are mixed or potentially compromised.
**Prevention:** Always specify the `algorithms` array parameter in JWT validation middleware options to explicitly whitelist acceptable algorithms.

## 2026-07-31 - Third-Party Request Hanging and Validation Swallowing
**Vulnerability:** Third-party API calls (specifically the Groq AI completion service) were performed using `axios.post` with no configured timeout, leaving the application vulnerable to socket/resource exhaustion and Denial of Service (DoS) if the external API became unresponsive. Additionally, standard input validation was wrapped inside a generic `try-catch` block that swallowed and masked all validation errors with a generic "Groq API Error".
**Learning:** Wrapping parameter verification inside a block that converts any caught error into a different exception can mask critical validation bugs and make tests/logic brittle.
**Prevention:** Always set a strict timeout (e.g., 15000 ms) on external HTTP requests and ensure validation logic either sits outside the general `try-catch` block or has its errors explicitly bypassed so they are not swallowed.

## 2026-08-09 - Stateless Session Deactivation Deficit
**Vulnerability:** Under standard stateless token systems (like JWT-based auth used here), deactivating a user account in the database does not automatically invalidate active access tokens. As a result, deactivated users could still successfully query their profiles at the `/api/user/current-user` endpoint using their active cookies, bypassing access revocation.
**Learning:** Over-reliance on stateless JWT signature verification without explicit database status checks on user-profile or metered endpoints allows deactivated or banned users to continue accessing resources until their tokens expire.
**Prevention:** Always query the user status (`isActive === false`) on key profile and resource endpoints, and force-clear the authentication cookies (`token`, `refreshToken`, `deviceId`) on the response if a deactivated session is detected.

## 2026-08-10 - Resource Consumption via Stateless Bypassed Deactivation
**Vulnerability:** Bypassing explicit database user activation checks on AI-intensive, metered endpoints (`/api/interview/resume`, `/api/interview/generate-question`, and `/api/interview/submit-answer`) allowed deactivated accounts with active JWT sessions to exploit system resources and consume AI credits/third-party API budget before session expiration.
**Learning:** Verification of the JWT token signature alone is insufficient for billing or metered services, where immediate access revocation must be guaranteed for deactivated, suspended, or deleted accounts.
**Prevention:** Perform explicit database checks (`isActive !== false`) on all metered or AI-driven endpoints, securely delete temporary local resources (such as uploaded files via `fs.unlinkSync`) immediately upon rejection, and return a robust `403 Forbidden` status.
