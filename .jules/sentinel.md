## 2026-05-21 - Identity Metadata Spoofing & Inconsistent Session Clearing
**Vulnerability:** The `googleAuth` controller prioritized client-provided `name` and `photo` in the request body over cryptographically verified claims from the Firebase ID token. Additionally, the `optionalAuth` middleware did not enforce device-to-session binding, and authentication failure paths across the app inconsistently cleared only the `token` cookie while leaving the `deviceId` cookie.

**Learning:** Trusting client-provided metadata when a verified source (the ID token) is available creates an identity spoofing risk. Inconsistent session clearing can lead to "half-authenticated" states where session tracking identifiers remain on the client after the authentication token is revoked.

**Prevention:** Always prioritize verified claims from authentication providers (like Firebase) over user-supplied request bodies. Ensure that all authentication failure and logout paths use a centralized or consistent mechanism to clear all session-related cookies (`token`, `deviceId`, etc.) to prevent session residue and potential replay risks.
