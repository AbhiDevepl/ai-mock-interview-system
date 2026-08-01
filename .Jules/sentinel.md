# Sentinel Security Journal

## 2026-03-29 - JWT Algorithm Confusion Protection
**Vulnerability:** Insecure default verification of JWT signatures, where `jwt.verify` by default accepts any signing algorithm provided in the token header (such as `none` or asymmetric algorithms), leading to algorithm switching or key confusion attacks (e.g., using a public key symmetrically).
**Learning:** Although `jsonwebtoken` prevents `none` by default in newer versions, explicitly restricting verification to a whitelist of symmetric algorithms (such as `["HS256"]`) is essential to prevent signature verification bypass when symmetric and asymmetric keys are mixed or potentially compromised.
**Prevention:** Always specify the `algorithms` array parameter in JWT validation middleware options to explicitly whitelist acceptable algorithms.

## 2026-07-31 - Third-Party Request Hanging and Validation Swallowing
**Vulnerability:** Third-party API calls (specifically the Groq AI completion service) were performed using `axios.post` with no configured timeout, leaving the application vulnerable to socket/resource exhaustion and Denial of Service (DoS) if the external API became unresponsive. Additionally, standard input validation was wrapped inside a generic `try-catch` block that swallowed and masked all validation errors with a generic "Groq API Error".
**Learning:** Wrapping parameter verification inside a block that converts any caught error into a different exception can mask critical validation bugs and make tests/logic brittle.
**Prevention:** Always set a strict timeout (e.g., 15000 ms) on external HTTP requests and ensure validation logic either sits outside the general `try-catch` block or has its errors explicitly bypassed so they are not swallowed.

## 2026-08-01 - Metered Resource Access and File Accumulation by Deactivated Users
**Vulnerability:** Deactivated users with valid session tokens could continue to make requests to metered AI endpoints (`generateQuestion`, `analyzeResume`) and access basic user details (`getCurrentUser`) because the underlying controllers trusted authentication state without verifying active user status. This allowed potential API billing exploitation and server disk/resource exhaustion through file accumulation since uploaded files (resumes) were left orphaned when requests failed authorization implicitly.
**Learning:** Authentication checks (such as decodable JWT signatures) only prove identity, not authority or status. Costly or metered resources must always explicitly confirm user activation status, and file pipelines must cleanly delete temporary resources immediately upon authorization failure.
**Prevention:** Verify `isActive !== false` on any route accessing paid or resource-heavy services. Perform clean-up operations (`fs.unlinkSync`) within the authorization block immediately if any validation or authorization check fails.
