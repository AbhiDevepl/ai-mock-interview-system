## 2026-05-24 - Identity Spoofing and Insecure Session Clearing

**Vulnerability:** Identity metadata (name and picture) was blindly trusted from client-provided request bodies during Google OAuth login, and authentication cookies were inconsistently cleared on session validation failures.

**Learning:** Relying on client-provided data for identity metadata when a cryptographically verified alternative (the ID token claims) is available creates a spoofing risk. Additionally, partial cookie clearing (e.g., clearing the token but leaving the device ID) can lead to inconsistent session states and potential session replay vulnerabilities.

**Prevention:** Always prioritize verified claims from authentication tokens over client-provided metadata. Ensure all authentication-related cookies are cleared atomically on any authentication or session validation failure.
