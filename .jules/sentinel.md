## 2026-06-29 - Inconsistent Session Cookie Clearing
**Vulnerability:** Authentication failure paths (e.g., missing device binding, session mismatch, account deactivation) were inconsistently clearing session cookies. In some cases, only the JWT `token` was cleared while the `deviceId` remained, or neither was cleared if a user record was missing.
**Learning:** Incomplete cookie clearing can lead to "ghost" sessions where the client-side state believes it is authenticated while the server rejects requests, leading to inconsistent UI behavior and potential session replay/mismatch issues.
**Prevention:** Always ensure all authentication-related cookies (both identity tokens and device bindings) are cleared on every authentication failure or authorization rejection path.
