## 2026-05-21 - [Hardened deviceId Cookie Security]
**Vulnerability:** The `deviceId` cookie was explicitly set with `httpOnly: false`, allowing potential access via client-side scripts (XSS).
**Learning:** Even if a cookie is not currently used for critical authorization in middleware, exposing it to JavaScript unnecessarily increases the attack surface.
**Prevention:** Always default to `httpOnly: true` for all session-related or sensitive identifiers in cookies unless there is a well-documented requirement for client-side access.
