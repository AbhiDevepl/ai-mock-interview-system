# Sentinel Security Journal 🛡️

## 2026-05-18 - [Hardening Authentication and Session Management]
**Vulnerability:** Unverified identity spoofing via external tokens and insecure session cookie configurations.
**Learning:** The application verified the Firebase ID token but did not check the `email_verified` claim, which could allow unverified emails to access the system. Additionally, the `deviceId` cookie was explicitly set with `httpOnly: false`, unnecessarily exposing a session-related identifier to client-side scripts.
**Prevention:** Always verify all security-critical claims (like `email_verified`) from third-party identity providers and ensure session-related cookies are strictly `httpOnly` unless client-side access is explicitly required for functionality.
