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

## 2026-08-11 - Stateless JWT Session Deactivation on Metered Endpoints
**Vulnerability:** Standard stateless JWT token-based authentication does not verify user account status on each API request against the database. This allows deactivated/banned users to continue utilizing expensive, metered, or third-party AI resources (like Groq completion APIs or resume PDF text extractions) with currently valid access tokens.
**Learning:** Checking account status and credits using low-overhead database queries (such as `.select("isActive").lean()`) on high-risk, metered endpoints prevents unauthorized access and limits financial exposure from malicious or deactivated accounts.
**Prevention:** Always implement explicit database status verification for `isActive !== false` on any endpoint involving third-party metered API integration, and clean up associated temporary storage (e.g., uploaded files) if deactivation is detected.
