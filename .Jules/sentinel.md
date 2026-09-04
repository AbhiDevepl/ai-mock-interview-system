# Sentinel Security Journal

## 2026-03-29 - JWT Algorithm Confusion Protection
**Vulnerability:** Insecure default verification of JWT signatures, where `jwt.verify` by default accepts any signing algorithm provided in the token header (such as `none` or asymmetric algorithms), leading to algorithm switching or key confusion attacks (e.g., using a public key symmetrically).
**Learning:** Although `jsonwebtoken` prevents `none` by default in newer versions, explicitly restricting verification to a whitelist of symmetric algorithms (such as `["HS256"]`) is essential to prevent signature verification bypass when symmetric and asymmetric keys are mixed or potentially compromised.
**Prevention:** Always specify the `algorithms` array parameter in JWT validation middleware options to explicitly whitelist acceptable algorithms.

## 2026-07-31 - Third-Party Request Hanging and Validation Swallowing
**Vulnerability:** Third-party API calls (specifically the Groq AI completion service) were performed using `axios.post` with no configured timeout, leaving the application vulnerable to socket/resource exhaustion and Denial of Service (DoS) if the external API became unresponsive. Additionally, standard input validation was wrapped inside a generic `try-catch` block that swallowed and masked all validation errors with a generic "Groq API Error".
**Learning:** Wrapping parameter verification inside a block that converts any caught error into a different exception can mask critical validation bugs and make tests/logic brittle.
**Prevention:** Always set a strict timeout (e.g., 15000 ms) on external HTTP requests and ensure validation logic either sits outside the general `try-catch` block or has its errors explicitly bypassed so they are not swallowed.

## 2026-08-01 - Stateless JWT Bypassing for Deactivated Accounts on Metered APIs
**Vulnerability:** The application utilizes entirely stateless JWT verification (`isAuth` middleware) to achieve low latency. However, because the database is not checked during request authentication, a deactivated user holding a valid signed JWT session could continue to call metered AI endpoints (`analyzeResume`, `generateQuestion`, `submitAnswer`) and exploit paid third-party resources.
**Learning:** Stateless authentication architectures must be supplemented with explicit, lightweight database checks (`isActive !== false`) on expensive, metered, or state-changing routes to prevent financial and resource exploitation.
**Prevention:** Always perform a quick `.select("isActive").lean()` query before invoking third-party APIs or committing state modifications for authenticated requests to ensure active account status.
