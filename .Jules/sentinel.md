# Sentinel Security Journal

## 2026-03-29 - JWT Algorithm Confusion Protection
**Vulnerability:** Insecure default verification of JWT signatures, where `jwt.verify` by default accepts any signing algorithm provided in the token header (such as `none` or asymmetric algorithms), leading to algorithm switching or key confusion attacks (e.g., using a public key symmetrically).
**Learning:** Although `jsonwebtoken` prevents `none` by default in newer versions, explicitly restricting verification to a whitelist of symmetric algorithms (such as `["HS256"]`) is essential to prevent signature verification bypass when symmetric and asymmetric keys are mixed or potentially compromised.
**Prevention:** Always specify the `algorithms` array parameter in JWT validation middleware options to explicitly whitelist acceptable algorithms.

## 2026-03-30 - Account Deactivation Bypass on Session Bootstrap and Metered AI APIs
**Vulnerability:** Lack of user active status verification (`user.isActive !== false`) on session bootstrap (`/api/user/current-user`) and high-cost metered AI endpoints (`/api/interview/generate-question` and `/api/interview/resume`). This allowed deactivated users to continue accessing their profiles and exploiting expensive, resource-intensive third-party AI APIs (Groq/Llama) using unexpired 7-day access tokens.
**Learning:** Checking the deactivation status solely on login (`googleAuth`) or the `/api/auth/me` bootstrap endpoint is insufficient when multiple session bootstrap endpoints or stateless JWTs are used. Additionally, critical/metered external API calls must be explicitly defended by validating account status in the database to prevent API abuse and resource/credit exhaustion.
**Prevention:** Always explicitly select and verify the `isActive` status of the requesting user on session bootstrap endpoints and before invoking any expensive, metered, or third-party downstream APIs. Deactivated users should be rejected immediately, have their session cookies cleared, and any temporary files uploaded in the request (e.g., resume PDFs) must be synchronously deleted to prevent storage leak DoS.
