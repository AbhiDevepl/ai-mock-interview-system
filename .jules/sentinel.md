# Sentinel Security Journal 🛡️

This journal tracks critical security learnings, vulnerability patterns, and architectural security decisions for the AI Mock Interview System.

## 2026-04-24 - [Insecure Session Clearing & Identity Metadata Trust]
**Vulnerability:** Identity metadata (name, picture) was trusted from the client during login, and session cookies were inconsistently cleared on authentication failures.
**Learning:** Defense in depth requires that even 'non-critical' metadata be verified cryptographically (e.g., from Firebase ID tokens) if available. Furthermore, session management should ensure all related identifiers (token, deviceId) are purged together to prevent partial session replay or inconsistent state.
**Prevention:** Always prioritize server-side verified claims over client-provided body data. Ensure a unified 'session purge' logic is applied across all middleware and controller failure paths.
