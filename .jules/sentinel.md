# Sentinel Security Journal

## 2026-05-19 - Identity Spoofing & Deactivation Bypass hardening
**Vulnerability:** Identity spoofing via client-provided metadata and authentication bypass for deactivated users.
**Learning:** Sourcing user metadata (name, picture) from the client instead of verified OIDC/Firebase claims allows users to spoof their identity in logs and potentially other systems. Deactivated users could log back in because the `googleAuth` flow lacked an explicit `isActive` check.
**Prevention:** Always source identity metadata from verified token claims. Enforce account status checks during the authentication flow.
