## 2026-06-21 - Identity Spoofing & Insecure Session Clearing
**Vulnerability:** Identity spoofing via request body in `googleAuth` and partial cookie clearing on authentication failure.
**Learning:** The application trusted client-provided `name` and `photo` instead of verified Firebase ID token claims. Additionally, only the access token was cleared on some failure paths, leaving the refresh token active.
**Prevention:** Always prioritize verified identity claims from trusted providers (Firebase/OIDC). Ensure all session-related cookies (access and refresh tokens) are cleared consistently on all authentication failure and account deactivation paths.
