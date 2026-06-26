## 2026-03-10 - Identity Spoofing via Client-Provided Metadata
**Vulnerability:** A malicious user could spoof their name and picture by providing altered values in the login request body, despite authenticating with a valid Google ID token.
**Learning:** The application was trusting `req.body` for user metadata while only using the ID token for email/UID verification. In OIDC flows, the ID token is a cryptographically signed document that already contains verified identity attributes.
**Prevention:** Always prioritize attributes (name, picture, etc.) from the cryptographically verified ID token over client-provided request parameters during authentication.

## 2026-03-10 - Inconsistent Session Cookie Invalidation
**Vulnerability:** On certain authentication failure paths (e.g., account deactivation or session mismatch), the application was clearing the `token` cookie but leaving the `deviceId` cookie behind, leading to inconsistent client state.
**Learning:** Security state is often distributed across multiple cookies. Inconsistent clearing can leave "ghost" session identifiers that might be misused or cause logic errors in the frontend.
**Prevention:** Establish a unified security state invalidation routine that clears all related authentication identifiers (`token`, `deviceId`, etc.) on any terminal auth failure.

## 2026-03-10 - Stolen Token Usage in "Optional" Contexts
**Vulnerability:** The `optionalAuth` middleware was verifying JWT signatures but skipping the session-to-device binding check, allowing a stolen token to be used on unauthorized devices in "optional" contexts.
**Learning:** Security checks are often relaxed in "optional" or "soft" authentication middleware, creating gaps where a stolen credential remains partially useful even if it fails strict checks.
**Prevention:** Apply consistent security constraints (like device-to-session binding and blacklist checks) across both mandatory and optional authentication layers.
