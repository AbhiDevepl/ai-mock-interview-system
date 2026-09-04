# Sentinel Security Journal

## 2026-03-29 - JWT Algorithm Confusion Protection
**Vulnerability:** Insecure default verification of JWT signatures, where `jwt.verify` by default accepts any signing algorithm provided in the token header (such as `none` or asymmetric algorithms), leading to algorithm switching or key confusion attacks (e.g., using a public key symmetrically).
**Learning:** Although `jsonwebtoken` prevents `none` by default in newer versions, explicitly restricting verification to a whitelist of symmetric algorithms (such as `["HS256"]`) is essential to prevent signature verification bypass when symmetric and asymmetric keys are mixed or potentially compromised.
**Prevention:** Always specify the `algorithms` array parameter in JWT validation middleware options to explicitly whitelist acceptable algorithms.

## 2026-03-31 - Missing Account Deactivation Enforcement on API and Session Retrieval Endpoints
**Vulnerability:** Incomplete account deactivation enforcement where deactivated users (`isActive: false`) could still retrieve user details and perform metered, resource-intensive operations (such as PDF resume analysis and question generation utilizing Groq API) as long as they possessed a valid, unexpired session JWT.
**Learning:** Checking account status strictly during the authentication/login flow is insufficient if JWT tokens have long lifespans (e.g. 7 days). Session verification endpoints (`getCurrentUser`) and high-impact or costly API handlers must perform active, stateful checks on the database to ensure the requesting user's account is still active.
**Prevention:** Always retrieve and validate the active state (`user.isActive`) from the database on session bootstrap/retrieval endpoints and sensitive, metered resource routes.
