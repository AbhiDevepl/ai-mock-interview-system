## 2026-05-21 - [HIGH] Auth Flow Hardening: googleAuth Identity Spoofing and Deactivation Bypass

**Vulnerability:**
1. Deactivated users could still log in via `googleAuth` because the controller did not check the `isActive` status during the login flow, only during subsequent session validation.
2. The `googleAuth` controller prioritized client-provided `name` and `photo` from the request body over the verified data from the Firebase ID token, allowing potential identity spoofing if the client sent malicious data.

**Learning:**
Authentication entry points must consistently verify account state (e.g., `isActive`) at the time of login. Prioritizing client-provided data over verified token claims from a trusted identity provider (like Firebase) introduces spoofing risks.

**Prevention:**
1. Always check `isActive` status during the initial login/authentication flow.
2. Use verified identity claims (email, name, picture) from the trusted identity provider (Firebase) whenever possible.
