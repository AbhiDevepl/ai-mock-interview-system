## 2026-05-22 - [Incomplete Cookie Clearing on Auth Failure]
**Vulnerability:** Zombie authentication cookies persisting after session invalidation.
**Learning:** Authenticated sessions often rely on multiple cookies (e.g., `token` and `deviceId`). Clearing only one (or none) in some error paths allows orphaned cookies to remain, potentially leading to inconsistent application states or security risks if a session is hijacked but partially invalidated.
**Prevention:** Always clear the entire set of authentication-related cookies (e.g., `token`, `deviceId`, `session_id`) on EVERY path that results in an authentication failure (missing binding, expiration, blacklist, account deactivation).
