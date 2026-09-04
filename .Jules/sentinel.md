# Sentinel Security Journal

## 2026-03-29 - JWT Algorithm Confusion Protection
**Vulnerability:** Insecure default verification of JWT signatures, where `jwt.verify` by default accepts any signing algorithm provided in the token header (such as `none` or asymmetric algorithms), leading to algorithm switching or key confusion attacks (e.g., using a public key symmetrically).
**Learning:** Although `jsonwebtoken` prevents `none` by default in newer versions, explicitly restricting verification to a whitelist of symmetric algorithms (such as `["HS256"]`) is essential to prevent signature verification bypass when symmetric and asymmetric keys are mixed or potentially compromised.
**Prevention:** Always specify the `algorithms` array parameter in JWT validation middleware options to explicitly whitelist acceptable algorithms.

## 2026-03-30 - Authorization Bypass on Deactivated Accounts
**Vulnerability:** Deactivated users were able to bypass access controls during bootstrapping (`/api/user/current-user`) and perform actions on sensitive/expensive endpoints (such as `generateQuestion` and `analyzeResume`) because `isAuth` only validated JWT signature correctness without fetching user status, and individual controllers lacked consistency checks for the `isActive` attribute.
**Learning:** Decoupled JWT validation is efficient but creates a temporal sync issue where revoked, deactivated, or banned users remain authorized for the duration of the JWT's lifespan (e.g., 7 days) unless individual critical/expensive controllers or bootstrappers explicitly enforce an active state verification check.
**Prevention:** Critical backend endpoints—especially those interacting with external, metered AI services or performing user bootstrapping—must verify user active state (e.g., `user.isActive !== false`) in addition to stateless token signature checks.
